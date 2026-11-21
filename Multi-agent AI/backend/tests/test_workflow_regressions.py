"""Exercise the real graph/HTTP contract without provider calls or Mongo writes."""
import os
import unittest
from unittest.mock import patch
from contextlib import ExitStack

import httpx
from pydantic import BaseModel
from fastapi.testclient import TestClient
from langgraph.checkpoint.memory import InMemorySaver

os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test')
with patch('langgraph.checkpoint.mongodb.MongoDBSaver', return_value=InMemorySaver()):
    import workflow.graph as graph
    from main import app
from core.exceptions import LLMQuotaExceededError, LLMAPIError
from agents import llm_client
from pymongo.errors import ServerSelectionTimeoutError


class TinyResponse(BaseModel):
    summary: str


class WorkflowRegressions(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(patch.dict(os.environ, {'AI_SERVICE_TOKEN': 'test-internal-token'}))
        self.stack.enter_context(patch.object(llm_client, '_RESOLVED_MODEL', None))
        self.stack.enter_context(patch.object(llm_client, '_RESOLVED_API_VERSION', None))
        self.stack.enter_context(patch('services.ipca_service.ipca_graph', graph.builder.compile()))
        self.client = TestClient(app)
        self.payload = {'student_name': 'Test Student', 'target_role': 'Developer', 'resume_text': 'Python developer. Education in computing. Built a tested API project.'}

    def request(self):
        return self.client.post('/api/v1/ipca/analyze', json=self.payload, headers={'x-ai-service-token': 'test-internal-token'})

    def test_quota_survives_graph_and_http_handler(self):
        self.stack.enter_context(patch.object(graph, 'analyze_resume_with_ai', side_effect=LLMQuotaExceededError('Daily quota exhausted')))
        response = self.request()
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()['error_code'], 'LLM_QUOTA_EXCEEDED')

    def test_checkpoint_database_failure_has_operational_error_code(self):
        self.stack.enter_context(patch('services.ipca_service.ipca_graph.invoke', side_effect=ServerSelectionTimeoutError('Private connection details')))
        response = self.request()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['error_code'], 'AI_DATABASE_UNAVAILABLE')
        self.assertNotIn('Private connection details', response.text)

    def test_unexpected_workflow_failure_keeps_error_contract(self):
        self.stack.enter_context(patch('services.ipca_service.ipca_graph.invoke', side_effect=RuntimeError('Private failure details')))
        response = self.request()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()['error_code'], 'WORKFLOW_EXECUTION_ERROR')
        self.assertNotIn('Private failure details', response.text)

    def test_successful_graph_returns_resume_report(self):
        self.stack.enter_context(patch.object(graph, 'analyze_resume_with_ai', return_value={'summary': 'Fixture summary', 'extracted_skills': ['Python'], 'strengths': ['API project']}))
        for name in ('analyze_skill_gaps', 'generate_interview_questions', 'generate_career_recommendations'):
            self.stack.enter_context(patch.object(graph, name, return_value={}))
        response = self.request()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['workflow_status'], 'completed')
        self.assertEqual(response.json()['final_report']['resume_analysis']['extracted_skills'], ['Python'])

    def test_parallel_agent_failures_produce_warnings_not_graph_crash(self):
        self.stack.enter_context(patch.object(graph, 'analyze_resume_with_ai', return_value={'summary': 'Fixture summary', 'extracted_skills': ['Python']}))
        self.stack.enter_context(patch.object(graph, 'analyze_skill_gaps', return_value={}))
        for name in ('generate_interview_questions', 'generate_career_recommendations'):
            self.stack.enter_context(patch.object(graph, name, side_effect=LLMAPIError('Provider overloaded')))
        response = self.request()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['workflow_status'], 'completed_with_warnings')
        self.assertEqual(len(response.json()['final_report']['warnings']), 2)

    def test_quota_does_not_try_more_models(self):
        self.stack.enter_context(patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'}))
        transport = self.stack.enter_context(patch.object(httpx.Client, 'post', return_value=httpx.Response(429, json={'error': {'message': 'Daily quota exceeded'}})))
        with self.assertRaises(LLMQuotaExceededError):
            llm_client.call_gemini('Test', 'Test', TinyResponse)
        self.assertEqual(transport.call_count, 1)

    def test_overload_uses_one_supported_fallback(self):
        self.stack.enter_context(patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key', 'GEMINI_MODEL': 'configured-model', 'GEMINI_FALLBACK_MODEL': 'fallback-model'}))
        transport = self.stack.enter_context(patch.object(httpx.Client, 'post', side_effect=[
            httpx.Response(503, json={'error': {'message': 'Overloaded'}}),
            httpx.Response(200, json={'candidates': [{'content': {'parts': [{'text': '{"summary":"Fixture response"}'}]}}]}),
        ]))
        self.assertEqual(llm_client.call_gemini('Test', 'Test', TinyResponse).summary, 'Fixture response')
        self.assertEqual(transport.call_count, 2)
        self.assertIn('fallback-model', transport.call_args.args[0])

    def test_overload_cannot_create_an_unbounded_retry_loop(self):
        self.stack.enter_context(patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key', 'GEMINI_MODEL': 'configured-model', 'GEMINI_FALLBACK_MODEL': 'fallback-model'}))
        transport = self.stack.enter_context(patch.object(httpx.Client, 'post', return_value=httpx.Response(503, json={'error': {'message': 'Overloaded'}})))
        with self.assertRaises(LLMAPIError):
            llm_client.call_gemini('Test', 'Test', TinyResponse)
        self.assertEqual(transport.call_count, 2)

    def test_response_timeout_uses_only_one_fallback(self):
        self.stack.enter_context(patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key', 'GEMINI_MODEL': 'configured-model', 'GEMINI_FALLBACK_MODEL': 'fallback-model'}))
        transport = self.stack.enter_context(patch.object(httpx.Client, 'post', side_effect=[
            httpx.ReadTimeout('Overloaded model'),
            httpx.Response(200, json={'candidates': [{'content': {'parts': [{'text': '{"summary":"Fixture response"}'}]}}]}),
        ]))
        self.assertEqual(llm_client.call_gemini('Test', 'Test', TinyResponse).summary, 'Fixture response')
        self.assertEqual(transport.call_count, 2)


    def test_empty_profile_does_not_invent_qualifications(self):
        with patch.object(graph, 'generate_career_recommendations', return_value={}) as career:
            graph.career_node({'student_name': 'Test', 'target_role': 'Developer'})
            self.assertEqual(career.call_args.kwargs['skills'], [])
            self.assertEqual(career.call_args.kwargs['projects'], [])
            self.assertEqual(career.call_args.kwargs['education'], 'Not provided; do not infer')
        with patch.object(graph, 'generate_interview_questions', return_value={}) as interview:
            graph.interview_node({'student_name': 'Test', 'target_role': 'Developer'})
            self.assertEqual(interview.call_args.kwargs['skills'], [])


if __name__ == '__main__':
    unittest.main()

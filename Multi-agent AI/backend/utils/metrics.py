from prometheus_client import Counter, Histogram


# Count agent executions
AGENT_EXECUTIONS = Counter(
    "ipca_agent_executions_total",
    "Total number of agent executions",
    ["agent_name", "status"]
)


# Measure agent execution duration
AGENT_DURATION = Histogram(
    "ipca_agent_execution_seconds",
    "Time taken by IPCA agents",
    ["agent_name"]
)


# Count complete workflow executions
WORKFLOW_EXECUTIONS = Counter(
    "ipca_workflow_executions_total",
    "Total IPCA workflow executions",
    ["status"]
)


# Measure total workflow duration
WORKFLOW_DURATION = Histogram(
    "ipca_workflow_duration_seconds",
    "Total IPCA workflow execution time"
)
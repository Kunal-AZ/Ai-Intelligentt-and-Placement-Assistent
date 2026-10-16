import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (request, response) => {
  response.status(200).json({
    success: true,
    data: { status: 'ok', service: 'placement-assistant-api', requestId: request.id },
  });
});

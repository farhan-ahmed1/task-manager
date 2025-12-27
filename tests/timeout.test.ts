import { Request, Response, NextFunction } from 'express';
import { requestTimeout } from '../src/middleware/timeout';

describe('Request Timeout Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let onMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    onMock = jest.fn();

    req = {};
    res = {
      status: statusMock,
      headersSent: false,
      on: onMock,
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call next without timing out for fast requests', () => {
    const middleware = requestTimeout(1000);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should timeout slow requests after specified duration', () => {
    const middleware = requestTimeout(1000);
    middleware(req as Request, res as Response, next);

    jest.advanceTimersByTime(1000);

    expect(statusMock).toHaveBeenCalledWith(408);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
      message: 'Request exceeded 1000ms timeout',
    });
  });

  it('should not timeout if headers already sent', () => {
    const middleware = requestTimeout(1000);
    res.headersSent = true;

    middleware(req as Request, res as Response, next);
    jest.advanceTimersByTime(1000);

    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should use default timeout of 30 seconds if not specified', () => {
    const middleware = requestTimeout();
    middleware(req as Request, res as Response, next);

    jest.advanceTimersByTime(29999);
    expect(statusMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(statusMock).toHaveBeenCalledWith(408);
  });

  it('should register finish and close event handlers', () => {
    const middleware = requestTimeout(1000);
    middleware(req as Request, res as Response, next);

    expect(onMock).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('close', expect.any(Function));
  });
});

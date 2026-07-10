import autoBind from "auto-bind";

class Controller {
  constructor() {
    autoBind(this);
  }

  successResponse(res: any, statusCode: number, message: string, data?: any) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  }

  errorResponse(res: any, statusCode: number, message: string, error?: any) {
    return res.status(statusCode).json({
      status: "error",
      message,
      error,
    });
  }
}

export default Controller;

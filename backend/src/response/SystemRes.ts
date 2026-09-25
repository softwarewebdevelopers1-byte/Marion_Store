import type IApiResponse from "../types/apiResponse.js";

function ApiResponse<T>(
  Message?: string,
  TimeStamp?: Date,
  Token?: string,
  Data?: T,
): IApiResponse<T> {
  return {
    Message: Message ? Message : null,
    TimeStamp: TimeStamp ? TimeStamp : new Date(),
    Token: Token ? Token : null,
    Data: Data ?? null,
  };
}

export default ApiResponse;

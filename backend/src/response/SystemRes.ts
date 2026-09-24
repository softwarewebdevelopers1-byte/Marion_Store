import type IApiResponse from "../types/apiResponse.js";

function ApiResponse(
  Message?: string,
  TimeStamp?: Date,
  Token?: string,
): IApiResponse {
  return {
    Message: Message ? Message : null,
    TimeStamp: TimeStamp ? TimeStamp : new Date(),
    Token: Token ? Token : null,
  };
}

export default ApiResponse;

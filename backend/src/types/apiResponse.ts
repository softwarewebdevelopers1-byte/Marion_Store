export default interface IApiResponse<T> {
  Message: string | null;
  TimeStamp: Date;
  Token: string | null;
  Data: T | null;
}

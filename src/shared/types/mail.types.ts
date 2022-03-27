export interface AllMailResponse {
  count: number;
  mails: {
    mail_id: string;
    subject: string;
  }[];
}

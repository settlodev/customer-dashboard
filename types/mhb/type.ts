export interface NidaQuestion {
  userId: string;
  identificationNumber: string;
  questionNumber: number;
  questionCode: string;
  questionEn: string;
  questionSw: string;
  hasMoreQuestions: boolean;
  timestamp: number;
}

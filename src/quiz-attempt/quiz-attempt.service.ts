// src/quiz-attempt/quiz-attempt.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { SubmitQuizAttemptDto } from './dto/quiz-attempt.dto';
import { Question } from 'src/question/entities/question.entity';
import { Option } from 'src/option/entities/option.entity';
import { QuizType } from 'src/utils/quizType.enum';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Sequelize } from 'sequelize-typescript';
import { ChatOpenAI } from '@langchain/openai';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';


const outputSchema = z.object({
  question_obtained_marks: z.number()
});

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectModel(QuizAttempt)
    private readonly quizAttemptModel: typeof QuizAttempt,
    @InjectModel(Answer)
    private readonly answerModel: typeof Answer,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Option)
    private readonly optionModel: typeof Option,
    @InjectModel(Quiz)
    private readonly quizModel: typeof Quiz,
    private readonly sequelize: Sequelize,
  ) { }


  async submitQuizAttempt(student_id: number, submitQuizAttemptDto: SubmitQuizAttemptDto) {
    const { quiz_id, answers } = submitQuizAttemptDto;

    // Start a transaction
    const transaction = await this.sequelize.transaction();

    try {


      // Get the quiz by ID within the transaction
      const quiz = await this.quizModel.findByPk(quiz_id, {
        include: [{
          model: Subject,
          attributes: ["title"],
          include: [{
            model: Bot,
            attributes: ["ai_model"]
          }]
        }],
        transaction
      },);
      if (!quiz) {
        throw new Error(`Quiz with ID ${quiz_id} not found`);
      }

      // Create a new quiz attempt within the transaction
      const quizAttempt = await this.quizAttemptModel.create(
        {
          student_id,
          quiz_id,
          obtained_score: 0, // Initialize score

        },
        { transaction }
      );

      let totalScore = 0;

      for (const answer of answers) {
        const question = await this.questionModel.findByPk(answer.question_id, { transaction });
        if (!question) {
          throw new Error(`Question with ID ${answer.question_id} not found`);
        }

        if (quiz.quiz_type === QuizType.MCQS) {
          // For multiple-choice questions, check if the selected option is correct
          const selectedOption = await this.optionModel.findByPk(answer.option_id, { transaction });
          const isCorrect = selectedOption?.is_correct || false;

          if (isCorrect) {
            totalScore += 1; // Increment score for correct answers
          }

          // Save the answer with isCorrect value in the transaction
          await this.answerModel.create(
            {
              attempt_id: quizAttempt.id,
              question_id: answer.question_id,
              option_id: answer.option_id,
              is_correct: isCorrect,
              obtained_score: isCorrect ? 1 : 0
            },
            { transaction }
          );
        } else if (quiz.quiz_type === QuizType.QA) {
          // Call OpenAI for QA questions
          const obtainedMarks = await this.evaluateAnswerWithOpenAI(
            question.text,
            question.score,
            answer.text_answer,
            quiz.subject.title,
            quiz.subject.bot.ai_model,
          );

          totalScore += obtainedMarks;

          // Save the answer in the transaction
          await this.answerModel.create(
            {
              attempt_id: quizAttempt.id,
              question_id: answer.question_id,
              text_answer: answer.text_answer,
              obtained_score: obtainedMarks,
            },
            { transaction }
          );
        }
      }

      // Update the quiz attempt with the total score within the transaction
      quizAttempt.obtained_score = totalScore;
      quizAttempt.marked = true
      await quizAttempt.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      return quizAttempt;
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await transaction.rollback();
      throw error;
    }
  }


  // Function to call OpenAI and evaluate answers
  async evaluateAnswerWithOpenAI(
    question: string,
    questionTotalScore: number,
    answer: string,
    subjectName: string,
    bot: string
  ): Promise<number> {


    // Fetch the API key from the admin profile
    const api = await SuperAdminProfile.findOne({
      attributes: ["openai"],
    });

    if (!api) {
      throw new Error("Unable to find API key.");
    }

    const api_key = api?.openai;

    if (api_key !== "") {



      // Initialize the OpenAI model
      const llm = new ChatOpenAI({
        model: bot,
        temperature: 0,
        maxTokens: 1000,
        timeout: 15000,
        maxRetries: 2,
        apiKey: api_key,
      });
      const template = `
               You are an intelligent evaluator. Your task is to evaluate a student's answer for a given question based on the subject knowledge. Focus on the correctness of the concepts. Grammar is irrelevant unless it affects the meaning. 
                - Check for the concepts explained in student's answer, give number according to that
              **Expected Output Json Format**
              {{
                "question_obtained_marks": number
              }}

              Rules:
                - The question_obtained_marks must be a positive integer and equal to or less than QuestionTotalMarks: {questionTotalScore}.
                - Use subjectName: {subjectName} to apply domain-specific knowledge for evaluation.

              Input:
                - Question: {question}
                - Question Total Score: {questionTotalScore}
                - Student's Answer: {answer}
                - Subject Name: {subjectName}

              Now evaluate the answer strictly as per the rules.
                
            `

      const AnswerGenrateTemplate = ChatPromptTemplate.fromMessages([
        ["system", template],
      ]);

      const promptValue = await AnswerGenrateTemplate.invoke({
        question: question,
        questionTotalScore: questionTotalScore,
        answer: answer,
        subjectName: subjectName
      });

      const llm_structured = llm.withStructuredOutput(outputSchema)

      const result = await llm_structured.invoke(promptValue)
      // const jsonResponse = JSON.parse(`${formattedResponse}`)
      console.log(result)
      return result.question_obtained_marks;
    }
  }

}
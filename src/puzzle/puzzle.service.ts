import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { CreatePuzzleAssignmnet, CreatePuzzleDto, DeletePuzzleAssignmnet, DeletePuzzleDto, InitializeSubmitPuzzleDto, SubmitPuzzleDto, UpdatePuzzleDto } from './dto/puzzle.dto';
import { Puzzle } from './entity/puzzle.entity';
import { Model, Op } from 'sequelize';
import { PuzzleAttempt } from './entity/puzzle-attempts.entity';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as fs from 'fs'
import { HumanMessage } from '@langchain/core/messages';
import { join } from 'path';
import { z } from 'zod';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { PuzzleAssignment } from './entity/puzzle-assignment.entity';
import { Role } from 'src/utils/roles.enum';
import { User } from 'src/user/entities/user.entity';

const output = z.object({
    remarks: z.string(),
    obtained_marks: z.number()
})
@Injectable()
export class PuzzleService {

    constructor(
        private readonly sequelize: Sequelize
    ) { }

    async puzzleMarking(puzzle_submission: PuzzleAttempt, puzzle: Puzzle) {

        try {

            const prompt = `
            You are an AI assistant tasked with evaluating student submissions based **strictly** on the teacher's description. You will receive an image as a base64 encoded string, the teacher's instructions, and the total possible marks. Your output MUST be a JSON object.

            **Input Data (Available in the context - DO NOT TRY TO ACCESS EXTERNAL FILES):**

            * **Base64 Encoded Image Data:** The image data will be provided within the 'image_solved' and 'image_unsolved' field of the content array in the HumanMessage. You do *not* need to read from the file system. You already have the image data.
            * **Teacher's Description:** <A clear and detailed description of the student's task, including the context of the image, what actions the student was expected to perform, specific criteria for evaluating the student's work (marks awarded or penalties applied), and any constraints or rules. Avoid ambiguity and ensure that all instructions are clear, measurable, and specific.>
            * **Total Possible Marks:** <Integer representing the total marks for the assignment.>

            **Your Task:**

            1. **Strictly Follow the Teacher's Description:** You must evaluate the student's submission based **strictly** on the teacher's description. Ignore any irrelevant elements or details not mentioned in the description. The evaluation must be done solely on the task and criteria provided by the teacher.

            2. **Analyze the Image:** Use your image analysis capabilities to **understand** the content of the image as described by the teacher. Ensure that only those elements mentioned in the teacher's description are considered for evaluation.

            3. **Interpret the Teacher's Description:**
               - Break down the task into **clear, measurable, and actionable steps** based on the teacher’s description.
               - Follow each criterion exactly as described by the teacher. For example, if the task is to match banknotes with their corresponding values using lines, make sure the correct banknote is matched with the correct value.
               - **Do not** deviate from these steps or assume anything not explicitly mentioned.

            4. **Evaluate the Submission:**
               - **Compare the two images (image_unsolved and image_solved)**:
                 - **Correctness of Matches**: If the task involves matching items by drawing lines (e.g., matching banknotes to their corresponding values), evaluate if the student has **correctly matched** the items.
                   - If the student has **not drawn a line** between two items (e.g., a banknote and its value), **mark it as incorrect** and **deduct marks** for the unattempted task.
                   - If the student **incorrectly matched** a banknote to the wrong value (or any item to the wrong corresponding match), **mark it as incorrect** and **deduct marks** for the incorrect match. Specify in the remarks what was incorrect.
                   - **Unattempted Tasks**: If the student has **left any part of the puzzle unattempted** (e.g., a line not drawn between a note and its corresponding value), **deduct marks** and explain in the remarks section that this part of the task was not attempted.
                 - **Partial Credit**: If the student **correctly matches some items** but not others, award partial marks. For example:
                   - "The student correctly matched 3 out of 4 banknotes to their corresponding values."
                   - "One incorrect match was made, and one banknote was left unconnected."
               - Provide **clear, comprehensive feedback** in the \`remarks\` field, explaining **exactly** what the student did or did not do, how it was done, and how marks were awarded or deducted. Example:
                 - "The student correctly matched two banknotes and their corresponding values. However, the third banknote was incorrectly matched with the wrong value, and the last banknote was left unconnected."
                 - "The student did not attempt to draw a line for the second banknote."
                 - "The task was completed with one incorrect match, one unattempted match, and two correct matches."

            5. **Generate JSON Output:** Create a JSON object with the following structure:
               **Do NOT add \`\`\`json before json data and \`\`\` after json data. It must be just JSON data starting with \{ and ending with \}.**

               {{
                 "obtained_marks": number, 
                 "remarks": "string"
               }}

            **Key Guidelines for Evaluation:**

            - **Strict Adherence to the Description:** The evaluation should be **strictly based on** the teacher’s description. Do **not** infer or assume any other details. If the description says "Match the banknotes with their corresponding values using lines," then that is what should be evaluated.
            - **Measurable and Objective Evaluation:** Ensure that all evaluation criteria are **measurable** and **objective**. For matching items, check that each item is matched correctly using lines. For tasks like drawing lines, ensure that the lines connect the correct items as described.
            - **Image Analysis:** Focus only on the elements described in the teacher’s description. If the task involves specific items, positions, or relationships (e.g., matching values with banknotes by drawing lines), **only** evaluate those elements and ensure that the student's actions align with the description.
            - **Partial Credit for Incorrect or Incomplete Submissions:** If the student **did not attempt** a task (e.g., a line was missing between items), **deduct marks**. Similarly, if the student **incorrectly matched** items, **deduct marks** and explain what was wrong in the \`remarks\`.
            - **Consistency in Marking:** Ensure consistency in awarding and deducting marks according to the clear, quantifiable criteria in the teacher's description. 
              - Do **not** make subjective judgments based on other aspects of the image that were not mentioned in the description.

            **Error Handling:**
            - If an error occurs, or if the data is unclear, return the following:

              {{
                "obtained_marks": 0, 
                "remarks": "Error: [Describe the error or missing elements]"
              }}
            - If the image is unreadable or the task is incomprehensible, return a relevant error message.

            **Important:** You are evaluating strictly based on the teacher's description. **No assumptions** are allowed, and the evaluation should not consider anything not explicitly described in the task. If a task was not attempted or done incorrectly, **deduct marks** and explain why in the feedback.
            `

            const visionModel = new ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash",
                maxOutputTokens: 2048,
                apiKey: "AIzaSyDQKEZxV2ZyXKKxpkV44rCQQLHoJ-4PW8U"
            });

            if (!visionModel) {
                throw new Error("Error connecting to Vision Model")
            }
            const path_answer = join(__dirname, '..', '..', 'images', `${puzzle_submission.image_url}`)

            const image_answer = fs.readFileSync(path_answer).toString("base64");


            if (!image_answer) {
                throw new Error("Error in getting images")
            }
            const input = [
                new HumanMessage({
                    content: [
                        {
                            type: "text",
                            text: `${prompt}\n\nTeacher's Description: ${puzzle.description}\nTotal Possible Marks: ${puzzle.total_score}`,
                        },
                        {
                            type: "image_url",
                            image_url: `data:image/png;base64,${image_answer}`, // Solved image
                        }
                    ],
                }),
            ];

            const structre_llm = visionModel.withStructuredOutput(output)
            const res = await structre_llm.invoke(input);

            console.log("response", res)

            if (res.obtained_marks && res.remarks) {
                await PuzzleAttempt.update({
                    marked: true,
                    obtained_score: Number(res.obtained_marks),
                    bot_remarks: res.remarks,
                    

                }, {
                    where: {
                        id: {
                            [Op.eq]: puzzle_submission.id
                        }
                    }
                })
            } else {
                throw new Error("unable to parse json data")
            }

            return res

        } catch (error) {
            console.log("error", error)
            throw new Error("Error Analysing image")
        }
    }

    async createSubmitPuzzle(submitPuzzleDto: InitializeSubmitPuzzleDto, req: any) {
        const { puzzle_assignment_id } = submitPuzzleDto

        try {

            const puzzle = await PuzzleAssignment.findByPk(Number(puzzle_assignment_id))

            if (!puzzle) {
                throw new Error("No puzzle assignment exist with given ID")
            }

            const puzzle_attempte_exist = await PuzzleAttempt.findOne({
                where: {
                    puzzle_assignment_id: {
                        [Op.eq]: Number(puzzle_assignment_id)
                    },
                    student_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })

            if (!puzzle_attempte_exist) {
                await PuzzleAttempt.create({
                    puzzle_assignment_id: Number(puzzle_assignment_id),
                    bot_remarks: "",
                    obtained_marks: 0,
                    student_id: req.user.sub,
                    marked: false
                })
            }


            return {
                statusCode: 200,
                message: "submittion initialized successfully",
            }


        } catch (error) {
            console.log("error", error)
            throw new HttpException(error.message || 'Failed to create Puzzle submittion initialization', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async submitPuzzle(file: Express.Multer.File, submitPuzzleDto: SubmitPuzzleDto, req: any) {
        const { puzzle_assignment_id } = submitPuzzleDto
        console.log("file", file, file.filename)
        try {

            const puzzle = await PuzzleAssignment.findByPk(Number(puzzle_assignment_id), {
                include: [{
                    model: Puzzle
                }]
            })
            if (!puzzle) {
                throw new Error("No puzzle found wiht ID")
            }

            let puzzle_submission = await PuzzleAttempt.findOne({
                where: {
                    puzzle_assignment_id: {
                        [Op.eq]: Number(puzzle_assignment_id)
                    },
                    student_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })

            if (puzzle_submission.marked) {
                throw new Error("puzzle already marked")
            }
            if (puzzle_submission) {
                puzzle_submission.image_url = file.filename
                await puzzle_submission.save()
            }

            if (!puzzle_submission) {
                puzzle_submission = await PuzzleAttempt.create({
                    image_url: `${file.filename}`,
                    puzzle_assignment_id: Number(puzzle_assignment_id),
                    bot_remarks: "",
                    obtained_marks: 0,
                    student_id: req.user.sub,
                    marked: false
                })
            }


            const res = await this.puzzleMarking(puzzle_submission, puzzle.puzzle)
            if (res) {
                return {
                    statusCode: 200,
                    message: "submitted successfully",
                    data: res
                }
            }

        } catch (error) {
            const path = join(__dirname, '..', '..', 'images', `${file.filename}`);
            fs.unlink(path, (err) => {
                if (err) {
                    throw new Error("unable to delete puzzle" + err.message)
                    return
                }
            })
            console.log("error", error)
            throw new HttpException(error.message || 'Failed to create Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async update(updatePuzzleDto: UpdatePuzzleDto, req: any) {
        const { id, level_id, subject_id, description, total_score } = updatePuzzleDto
        try {



            const puzzle = await Puzzle.findOne({
                where: {
                    id: {
                        [Op.eq]: id
                    },
                    created_by: {
                        [Op.eq]: req.user.sub
                    }
                }
            })

            if (!puzzle) {
                throw new HttpException("No puzzle found with this ID", HttpStatus.BAD_REQUEST)
            }

            if (req.user.role === Role.SUPER_ADMIN) {
                puzzle.level_id = level_id;
            }

            puzzle.subject_id = subject_id;
            puzzle.description = description
            puzzle.total_score = total_score

            await puzzle.save()

            return {
                statusCode: 200,
                message: "puzzle updated successfully"
            }
        } catch (error) {

            throw new HttpException(error.message || 'Failed to update Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async create(file: Express.Multer.File, createPuzzleDto: CreatePuzzleDto, req: any) {
        const transaction = await this.sequelize.transaction()
        try {
            const puzzle = await Puzzle.create({
                image_url: file ? `${file?.filename}` : null,
                level_id: req.user.role === Role.SUPER_ADMIN ? Number(createPuzzleDto.level_id) : req.user.level_id,
                subject_id: Number(createPuzzleDto.subject_id),
                description: createPuzzleDto.description,
                total_score: Number(createPuzzleDto.total_score),
                created_by: req.user.sub
            }, {
                transaction
            })

            if (req.user.role === Role.TEACHER) {
                await PuzzleAssignment.create({
                    teacher_id: req.user.sub,
                    puzzle_id: puzzle.id
                }, {
                    transaction
                })
            }

            await transaction.commit()
            return {
                statusCode: 200,
                message: `puzzle created ${req.user.role === Role.TEACHER && 'and Assigned successfully'}`
            }
        } catch (error) {
            await transaction.rollback()
            throw new HttpException(error.message || 'Failed to create Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(deletePuzzleDto: DeletePuzzleDto, req: any) {

        try {
            const puzzle = await Puzzle.findOne({
                where: {
                    id: {
                        [Op.eq]: deletePuzzleDto.puzzle_id
                    },
                    created_by: {
                        [Op.eq]: req.user.sub
                    }
                }

            })
            if (!puzzle) {
                throw new Error("puzzle with ID do not exist")
            }
            if (puzzle?.image_url) {
                const path = join(__dirname, '..', '..', 'images', `${puzzle.image_url}`);

                fs.unlink(path, (err) => {
                    if (err) {
                        throw new Error("unable to delete puzzle" + err.message)
                        return
                    }
                })
            }


            await Puzzle.destroy({
                where: {
                    id: {
                        [Op.eq]: deletePuzzleDto.puzzle_id
                    },
                    created_by: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                message: "puzzle deleted successfully"
            }
        } catch (error) {
            console.log("error", error.message)
            throw new HttpException(error.message || 'Failed to delete Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getByID(puzzle_id: string, req: any) {
        try {
            const puzzle = await Puzzle.findOne({
                where: {
                    id: {
                        [Op.eq]: Number(puzzle_id)
                    },
                    created_by: {
                        [Op.eq]: req.user.sub
                    }
                },
                include: [{
                    model: Subject
                }, {
                    model: Level
                }]
            })
            return {
                statusCode: 200,
                data: puzzle
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzle with this ID', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAssignedPuzzleByID(assigned_puzzle_id: number) {
        try {


            const puzzle = await PuzzleAssignment.findByPk(assigned_puzzle_id, {
                include: [{
                    model: Puzzle,
                    include: [{
                        model: Subject
                    }, {
                        model: Level
                    }]
                }]
            })
            return {
                statusCode: 200,
                data: puzzle
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to deleted puzzle assignment', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePuzzleAssignment(deletePuzzleAssignmnet: DeletePuzzleAssignmnet, req: any) {
        try {

            const puzzle_attempts_exist = await PuzzleAttempt.findOne({
                where: {
                    puzzle_assignment_id: {
                        [Op.eq]: deletePuzzleAssignmnet.puzzle_assignment_id
                    },
                }
            })

            if (puzzle_attempts_exist) {
                throw new HttpException("Can't delete puzzle assignment as attempted by students", HttpStatus.BAD_REQUEST)
                return
            }
            await PuzzleAssignment.destroy({
                where: {
                    id: {
                        [Op.eq]: deletePuzzleAssignmnet.puzzle_assignment_id
                    },
                    teacher_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                message: "Puzzle Assignment deleted successfully"
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to deleted puzzle assignment', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createPuzzleAssignment(createPuzzleAssignment: CreatePuzzleAssignmnet, req: any) {
        try {

            const puzzles = await PuzzleAssignment.create({
                teacher_id: req.user.sub,
                puzzle_id: createPuzzleAssignment.puzzle_id
            })
            return {
                statusCode: 200,
                message: "Puzzle Assignment created successfully"
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to create puzzle assignment', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllAssignedPuzzles(req: any) {
        try {

            const puzzles = await PuzzleAssignment.findAll({
                where: {
                    teacher_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                data: puzzles
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzles', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getByLevelSubject(req: any, page: number = 1, limit: number = 10) {
        try {
            const teacher = await TeacherProfile.findByPk(req.user.sub, {
                include: [{
                    model: Subject,
                    attributes: ["id"]
                }],
            });

            if (!teacher) {
                throw new HttpException("Error getting puzzles, no teacher found", HttpStatus.BAD_REQUEST);
            }

            // Calculate the offset based on the page and limit
            const offset = (page - 1) * limit;

            // Fetch paginated puzzles using findAndCountAll
            const { rows: puzzles, count: total } = await Puzzle.findAndCountAll({
                include: [
                    { model: Subject },
                    { model: Level },
                    {
                        required: false,
                        model: PuzzleAssignment,
                        where: {
                            teacher_id: {
                                [Op.eq]: req.user.sub
                            }
                        }
                    }
                ],
                where: {
                    level_id: {
                        [Op.eq]: req.user.level_id
                    },
                    subject_id: {
                        [Op.in]: teacher.subjects.map(subject => subject.id)
                    },
                    created_by: {
                        [Op.ne]: req.user.sub
                    }
                },
                limit,   // Number of records to fetch
                offset,  // Starting point for the records
                order: [['createdAt', 'DESC']], // Optional: Sort by creation date
            });

            // Calculate the total number of pages
            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Puzzles fetched successfully",
                data: puzzles,    // Paginated puzzles
                total,      // Total number of puzzles
                page,       // Current page
                totalPages  // Total number of pages
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to find Puzzle with this ID',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getByLevel(req: any, page: number = 1, limit: number = 10) {
        try {
            // Calculate the offset for pagination
            const offset = (page - 1) * limit;
    
            // Use findAndCountAll to get both the data and the total count
            const { rows: puzzles, count: total } = await PuzzleAssignment.findAndCountAll({
                include: [{
                    required: true,
                    model: Puzzle,
                    include: [{
                        model: Subject
                    }],
                    where: {
                        level_id: {
                            [Op.eq]: req.user.level_id
                        }
                    }
                },
                {
                    required: false,
                    model: PuzzleAttempt,
                    where: {
                        student_id: {
                            [Op.eq]: req.user.sub
                        }
                    }
                }],
                limit, // Set the limit per page
                offset, // Set the offset for pagination
                order: [['createdAt', 'DESC']] // Optional: To order by creation date
            });
    
            // Calculate total number of pages
            const totalPages = Math.ceil(total / limit);
    
            return {
                statusCode: 200,
                data: puzzles,
                total,
                page,
                totalPages
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to find puzzles with this level',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    



    async getAll(page: number = 1, limit: number = 10, req: any) {
        try {

            const offset = (page - 1) * limit;


            const { rows: puzzles, count: total } = await Puzzle.findAndCountAll({
                where: {
                    created_by: {
                        [Op.eq]: req.user.sub
                    }
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });


            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "puzzles fetched successfully",
                data: puzzles,
                total,
                page,
                totalPages,
            };

        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzle with this ID', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getPuzzleAttemptsByStudentSubject(params: any, req: any, page: number = 1, limit: number = 10) {
        if (!params.student_id || !params.subject_id) {
            throw new Error("subject_id and student_id must be defined in params: /:subject_id/:student_id");
        }

        try {
            const teacher_has_subject = await Subject.findByPk(Number(params.subject_id), {
                include: [{
                    required: true,
                    model: TeacherProfile,
                    where: {
                        id: {
                            [Op.eq]: req.user.sub
                        }
                    }
                }]
            });
            console.log("teacher_has_subject", teacher_has_subject);
            if (!teacher_has_subject) {
                throw new Error("Subject is UnAvailable to teacher");
            }

            // Calculate the offset for pagination
            const offset = (page - 1) * limit;

            // Use findAndCountAll to get both the data and the total count
            const { rows: data, count: total } = await PuzzleAttempt.findAndCountAll({
                where: {
                    student_id: {
                        [Op.eq]: Number(params.student_id)
                    },
                    marked: {
                        [Op.eq]: true
                    }
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: PuzzleAssignment,
                        include: [{
                            model: Puzzle,
                            where: {
                                subject_id: {
                                    [Op.eq]: Number(params.subject_id)
                                }
                            }
                        }],
                        where: {
                            teacher_id: {
                                [Op.eq]: req.user.sub
                            }
                        }
                    }
                ],
                limit,
                offset
            });

            // Calculate total number of pages
            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                data,
                total,
                page,
                totalPages
            };

        } catch (error) {
            throw new HttpException(
                error.message || "Error fetching puzzle attempts by student and subject.",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


}

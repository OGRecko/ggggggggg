import type { Course } from "../data/types";
import { pythonCourse } from "./python";
import { javaCourse } from "./java";
import { javascriptCourse } from "./javascript";
import { cppCourse } from "./cpp";
import { htmlCssCourse } from "./htmlcss";

export const courses: Course[] = [
  pythonCourse,
  javaCourse,
  javascriptCourse,
  cppCourse,
  htmlCssCourse,
];

export const courseById = (id: string | undefined) => courses.find((course) => course.id === id);
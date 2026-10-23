import type { Metadata } from "next";
import SimplexLesson from "./SimplexLesson";

export const metadata: Metadata = {
  title: "Simplex and optimisation",
  description: "How the simplex tableau walks a linear program from corner to corner.",
};

export default function SimplexPage() {
  return <SimplexLesson />;
}

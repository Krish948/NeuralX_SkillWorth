import { describe, expect, it } from "vitest";
import {
  calculateSalaryFromSkills,
  getJobMatchScore,
  getSkillGaps,
  getRecommendedNextSteps,
} from "@/data/skillsMapping";

describe("skillsMapping", () => {
  it("calculates salary range from known skills", () => {
    const result = calculateSalaryFromSkills(["React", "TypeScript"]);

    expect(result.estimated).toBe(68000);
    expect(result.min).toBe(54400);
    expect(result.max).toBe(81600);
  });

  it("ignores unknown skills in salary computation", () => {
    const result = calculateSalaryFromSkills(["Unknown Skill"]);

    expect(result.estimated).toBe(35000);
  });

  it("returns correct skill gaps", () => {
    const gaps = getSkillGaps(["React", "TypeScript"], ["React", "Node.js", "Docker"]);

    expect(gaps).toEqual(["Node.js", "Docker"]);
  });

  it("calculates job match score as percentage", () => {
    const score = getJobMatchScore(["React", "TypeScript"], ["React", "Node.js", "TypeScript", "Docker"]);

    expect(score).toBe(50);
  });

  it("returns zero when job has no required skills", () => {
    const score = getJobMatchScore(["React"], []);

    expect(score).toBe(0);
  });

  it("recommends starter steps for an empty profile", () => {
    const steps = getRecommendedNextSteps([], [], false);

    expect(steps[0].title).toBe("Add your first skills");
    expect(steps.some(step => step.title === "Create a financial baseline")).toBe(true);
  });

  it("recommends skill gaps and finance planning for an active profile", () => {
    const steps = getRecommendedNextSteps(
      ["React", "TypeScript"],
      [{ role: "Frontend Developer", required_skills: ["React", "TypeScript", "Next.js"] }],
      false,
    );

    expect(steps[0].title).toContain("Frontend Developer");
    expect(steps.some(step => step.title === "Set a budget plan")).toBe(true);
  });
});

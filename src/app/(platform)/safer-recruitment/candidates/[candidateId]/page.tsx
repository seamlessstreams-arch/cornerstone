import { redirect } from "next/navigation";

export default function SaferRecruitmentCandidateRedirect({
  params,
}: {
  params: { candidateId: string };
}) {
  redirect(`/recruitment/candidates/${params.candidateId}`);
}

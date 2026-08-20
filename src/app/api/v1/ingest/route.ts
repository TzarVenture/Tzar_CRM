import { POST as handleIngestLead } from "./lead/route";

export async function POST(req: Request) {
  return handleIngestLead(req);
}

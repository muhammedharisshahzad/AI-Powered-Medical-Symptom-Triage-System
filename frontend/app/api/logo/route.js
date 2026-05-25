import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const logoPath = path.resolve(process.cwd(), "..", "logo.png");

  try {
    const data = await fs.readFile(logoPath);
    return new Response(data, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return new Response("Logo not found", { status: 404 });
  }
}

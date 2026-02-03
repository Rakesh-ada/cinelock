
import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // pdf2json usually works with files, so we write to a temp file first for robustness
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `upload-${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, buffer);

        const pdfParser = new PDFParser(null, true); // 1 = text only

        const parsedText = await new Promise<string>((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                // pdf2json returns raw content, simplified extract:
                const rawText = pdfParser.getRawTextContent();
                resolve(rawText);
            });

            pdfParser.loadPDF(tempFilePath);
        });

        // Cleanup
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({
            text: parsedText,
            filename: file.name
        });

    } catch (error) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
    }
}

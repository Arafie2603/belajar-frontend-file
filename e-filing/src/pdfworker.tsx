import { pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";

export default pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

document.getElementById('mergeButton').addEventListener('click', async () => {
    const mergeInput = document.getElementById('mergeInput');
    const mergeMessage = document.getElementById('mergeMessage');

    if (mergeInput.files.length === 0) {
        mergeMessage.textContent = 'Por favor, selecione os arquivos.';
        return;
    }

    mergeMessage.textContent = 'Juntando PDFs...';

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const file of mergeInput.files) {
        const arrayBuffer = await file.arrayBuffer();
        const donorPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
        copiedPages.forEach((page) => {
            pdfDoc.addPage(page);
        });
    }

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, 'merged.pdf', 'application/pdf');

    mergeMessage.textContent = 'PDFs juntados com sucesso.';
});

function download(bytes, fileName, mimeType) {
    const blob = new Blob([bytes], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

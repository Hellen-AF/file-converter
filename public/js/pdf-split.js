document.getElementById('splitInput').addEventListener('change', async () => {
    const splitInput = document.getElementById('splitInput');
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.innerHTML = '';

    if (!splitInput.files.length) return;

    const file = splitInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const pageWrapper = document.createElement('div');
        pageWrapper.classList.add('pageWrapper');
        
        const pageCheckbox = document.createElement('input');
        pageCheckbox.type = 'checkbox';
        pageCheckbox.classList.add('pageCheckbox');
        pageCheckbox.dataset.pageNumber = i;
        pageCheckbox.id = `page-${i}`;

        const label = document.createElement('label');
        label.htmlFor = `page-${i}`;
        label.textContent = `Página ${i}`;

        pageWrapper.appendChild(pageCheckbox);
        pageWrapper.appendChild(label);
        pageWrapper.appendChild(canvas);

        pdfViewer.appendChild(pageWrapper);
    }
});

document.getElementById('splitButton').addEventListener('click', async () => {
    const splitInput = document.getElementById('splitInput');
    const splitMessage = document.getElementById('splitMessage');
    const checkboxes = document.querySelectorAll('.pageCheckbox:checked');

    if (!splitInput.files.length) {
        splitMessage.textContent = 'Por favor, selecione um arquivo.';
        return;
    }

    if (checkboxes.length === 0) {
        splitMessage.textContent = 'Por favor, selecione pelo menos uma página.';
        return;
    }

    splitMessage.textContent = 'Dividindo PDF...';

    const file = splitInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    const selectedPages = Array.from(checkboxes).map(checkbox => Number(checkbox.dataset.pageNumber) - 1);
    const newPdfDoc = await PDFLib.PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, selectedPages);
    copiedPages.forEach(page => newPdfDoc.addPage(page));

    const pdfBytes = await newPdfDoc.save();
    download(pdfBytes, `split_pages.pdf`, 'application/pdf');

    splitMessage.textContent = 'PDF dividido com sucesso.';
});

function download(bytes, fileName, mimeType) {
    const blob = new Blob([bytes], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

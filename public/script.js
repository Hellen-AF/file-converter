let outputDirectoryHandle;

document.getElementById('selectFolderButton').addEventListener('click', async () => {
    outputDirectoryHandle = await window.showDirectoryPicker();
    const folderNameDiv = document.getElementById('folderName');
    folderNameDiv.textContent = `Selected folder: ${outputDirectoryHandle.name}`;
});

document.getElementById('convertButton').addEventListener('click', async () => {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';

    if (!outputDirectoryHandle) {
        messageDiv.textContent = 'Please select a folder first';
        return;
    }

    const fileInput = document.getElementById('inputFile');
    const outputFormat = document.getElementById('outputFormat').value;
    const output = document.getElementById('output');
    output.innerHTML = '';

    if (fileInput.files.length === 0) {
        messageDiv.textContent = 'Please select files';
        return;
    }

    messageDiv.textContent = 'Conversion in progress...';

    for (const file of fileInput.files) {
        const fileType = file.type;

        if (fileType === 'application/pdf') {
            await convertPdf(file, outputFormat, outputDirectoryHandle);
        } else if (fileType.startsWith('image/')) {
            await convertImage(file, outputFormat, outputDirectoryHandle);
        } else if (fileType === 'text/plain') {
            await convertText(file, outputFormat, outputDirectoryHandle);
        } else {
            messageDiv.textContent = 'Unsupported file type: ' + file.name;
            return;
        }
    }

    messageDiv.textContent = 'Conversion completed. Check the selected folder for the converted files.';
});

async function convertPdf(file, outputFormat, outputDirectoryHandle) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;

    if (outputFormat === 'txt') {
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        const blob = new Blob([fullText], { type: 'text/plain' });
        await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-converted.txt`, blob);
    } else if (outputFormat === 'jpg' || outputFormat === 'png') {
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            const img = canvas.toDataURL(`image/${outputFormat}`);
            const response = await fetch(img);
            const blob = await response.blob();
            await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-page-${i}.${outputFormat}`, blob);
        }
    } else if (outputFormat === 'pdf') {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-converted.pdf`, blob);
    }
}

async function convertImage(file, outputFormat, outputDirectoryHandle) {
    const reader = new FileReader();

    reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const newImg = canvas.toDataURL(`image/${outputFormat}`);
            const response = await fetch(newImg);
            const blob = await response.blob();
            await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-converted.${outputFormat}`, blob);
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

async function convertText(file, outputFormat, outputDirectoryHandle) {
    const reader = new FileReader();

    reader.onload = async (event) => {
        const text = event.target.result;

        if (outputFormat === 'txt') {
            const blob = new Blob([text], { type: 'text/plain' });
            await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-converted.txt`, blob);
        } else if (outputFormat === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text(text, 10, 10);
            const pdf = doc.output('blob');
            await saveFile(outputDirectoryHandle, `${file.name.split('.').slice(0, -1).join('.')}-converted.pdf`, pdf);
        }
    };

    reader.readAsText(file);
}

async function saveFile(directoryHandle, fileName, blob) {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
}

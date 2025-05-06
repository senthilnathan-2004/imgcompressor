
    const upload = document.getElementById("upload");
    const outputFormatSelect = document.getElementById("outputFormat");
    const qualitySlider = document.getElementById("quality");
    const qualityVal = document.getElementById("qualityVal");
    const resizeWidthInput = document.getElementById("resizeWidth");
    const resizeHeightInput = document.getElementById("resizeHeight");
    const maintainAspectRatioCheckbox = document.getElementById("maintainAspectRatio");
    const maxWidthInput = document.getElementById("maxWidth");
    const maxHeightInput = document.getElementById("maxHeight");
    const removeMetadataCheckbox = document.getElementById("removeMetadata");
    const processImageButton = document.getElementById("processImage");
    const infoDiv = document.getElementById("info");
    const outputContainer = document.getElementById("output-container");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    qualitySlider.oninput = () => {
        qualityVal.textContent = parseFloat(qualitySlider.value).toFixed(2);
    };

    processImageButton.addEventListener('click', () => {
        const file = upload.files[0];
        if (!file) {
            infoDiv.textContent = "Please select an image file.";
            outputContainer.innerHTML = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                handleImageProcessing(img, file);
            };
            img.onerror = () => {
                infoDiv.textContent = "Failed to load the image. Make sure it's a valid image file.";
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    async function handleImageProcessing(img, originalFile) {
        const outputFormat = outputFormatSelect.value;
        const quality = parseFloat(qualitySlider.value);
        let targetWidth = resizeWidthInput.value ? parseInt(resizeWidthInput.value) : img.width;
        let targetHeight = resizeHeightInput.value ? parseInt(resizeHeightInput.value) : img.height;
        const maintainAspectRatio = maintainAspectRatioCheckbox.checked;
        const maxWidth = maxWidthInput.value ? parseInt(maxWidthInput.value) : Infinity;
        const maxHeight = maxHeightInput.value ? parseInt(maxHeightInput.value) : Infinity;

        const aspectRatio = img.width / img.height;

        // Resize logic (max constraints first)
        if (img.width > maxWidth || img.height > maxHeight) {
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            targetWidth = Math.floor(img.width * ratio);
            targetHeight = Math.floor(img.height * ratio);
        }

        // Aspect ratio logic based on user input
        if (resizeWidthInput.value && !resizeHeightInput.value && maintainAspectRatio) {
            targetHeight = Math.floor(targetWidth / aspectRatio);
        } else if (!resizeWidthInput.value && resizeHeightInput.value && maintainAspectRatio) {
            targetWidth = Math.floor(targetHeight * aspectRatio);
        } else if (resizeWidthInput.value && resizeHeightInput.value && maintainAspectRatio) {
            // Prevent aspect ratio distortion if both inputs are set
            const ratioW = resizeWidthInput.value / img.width;
            const ratioH = resizeHeightInput.value / img.height;
            const finalRatio = Math.min(ratioW, ratioH);
            targetWidth = Math.floor(img.width * finalRatio);
            targetHeight = Math.floor(img.height * finalRatio);
        }

        // Draw to canvas
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Get compressed blob
        let mimeType = `image/${outputFormat}`;
        let filename = `compressed.${outputFormat === "jpeg" ? "jpg" : outputFormat}`;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

        if (blob) {
            const compressedURL = URL.createObjectURL(blob);
            const originalSizeKB = (originalFile.size / 1024).toFixed(2);
            const compressedSizeKB = (blob.size / 1024).toFixed(2);
            const compressionRatio = ((1 - (blob.size / originalFile.size)) * 100).toFixed(2);

            infoDiv.innerHTML = `
                <ul style="list-style: none; padding-left: 0;">
                    <li><strong>Original Size:</strong> ${originalSizeKB} KB</li>
                    <li><strong>Compressed Size:</strong> ${compressedSizeKB} KB</li>
                    <li><strong>Compression:</strong> ${compressionRatio}%</li>
                </ul>
            `;

            outputContainer.innerHTML = `
                <img src="${compressedURL}" alt="Compressed Image" style="max-width: 100%; height: auto;"><br>
                <button id="downloadBtn">Download ${filename}</button>
            `;

            const downloadBtn = document.getElementById("downloadBtn");
            downloadBtn.onclick = () => {
                const a = document.createElement("a");
                a.href = compressedURL;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(compressedURL);
            };
        } else {
            infoDiv.textContent = "Failed to compress the image. Your browser might not support the selected format.";
        }
    }

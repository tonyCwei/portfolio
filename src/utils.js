export function displayDialogue(text, onDisplayEnd) {
    const dialogueUI = document.getElementById("textbox-container");
    const dialogue = document.getElementById("dialogue");

    dialogueUI.style.display = "block";
    let index = 0;
    let currentText = "";
    const intervalRef = setInterval(() => {
        if (index < text.length) {
            currentText += text[index];
            dialogue.innerHTML = currentText;
            index++;
            return;
        }

        clearInterval(intervalRef);
    }, 1);


    const closeBtn = document.getElementById("close");

    function onCloseBtnClick() {
        onDisplayEnd();
        dialogueUI.style.display = "none";
        dialogue.innerHTML = "";
        clearInterval(intervalRef);
        closeBtn.removeEventListener("click", onCloseBtnClick);
    }

    closeBtn.addEventListener("click", onCloseBtnClick);

    addEventListener("keydown", (key) => {
        if (key.code === "Escape" || key.code === "Space") {
            closeBtn.click();
        }
    });
}

export function autoAdjCamScale(k) {
    const resizeFactor = k.width() / k.height();
    if (resizeFactor < 1) {//phone screen
        k.camScale(k.vec2(0.8));
    } else {
        k.camScale(k.vec2(1));
    }
    
}
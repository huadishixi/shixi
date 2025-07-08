function sendMessage() {
        const input = document.getElementById("user-input");
        const message = input.value.trim();
        if (!message) return;

        appendMessage("你", message, "user");
        input.value = "";

        fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            if (data.reply) {
                appendMessage("AI", data.reply, "ai");
            } else {
                appendMessage("系统", "发生错误：" + data.error, "ai");
            }
        });
    }

    function appendMessage(sender, text, cls) {
        const box = document.querySelector(".chat-box");
        const div = document.createElement("div");
        div.className = "chat-message " + cls;
        div.innerHTML = `<strong>${sender}:</strong> ${text}`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }
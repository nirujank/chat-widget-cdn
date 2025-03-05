class ChatWidget {
    constructor(apiUrl, userName, password, chatTitle) {
        this.apiUrl = apiUrl;
        this.isMinimized = false;
        this.token = null; // Token will be stored here
        this.userName = "defaultCitizen";
        this.password = "Citizen@INVORG";
        this.chatTitle = "citizenchat";
        this.chatId = null;

        // Authenticate user to get the JWT token
        this.authenticateUser();
    }

    async authenticateUser() {
        const loginApiUrl = `${this.apiUrl}/api/Auth/Login`;
        const loginData = {
            userName: this.userName,
            password: this.password
        };

        try {
            const response = await fetch(loginApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                throw new Error("Failed to authenticate. Please check your username and password.");
            }
            const data = await response.json();
            this.token = data.data.token; // Store the token

            console.log("Authentication successful. Token:", this.token);
            // Initialize the chat UI after successful authentication
            this.createChatTitle();
        } catch (error) {
            console.error("Authentication error:", error);
            alert("Authentication failed. Please try again.");
        }
    }

    //to generate new chatId
    async createChatTitle() {
        const chatTitleApiUrl = `${this.apiUrl}/api/chathistory/chats`;
        const titleData = {
            title: this.chatTitle,
        };

        try {
            const response = await fetch(chatTitleApiUrl, {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(titleData)
            });

            if (!response.ok) {
                throw new Error("Failed to create chat title. Please check.");
            }
            const data = await response.json();
            this.chatId = data.chatSession.id;

            console.log("ChatId Created successfully. chatId:", this.chatId);
            this.createChatUI();
        } catch (error) {
            console.error("chatId creation error:", error);
            alert("ChatId not Created Successfully. Please try again.");
        }
    }

    createChatUI() {
        if (!this.token) {
            alert("User not authenticated. Cannot load chat.");
            return;
        }
        if (!this.chatId) {
            alert("ChatId not Created. Cannot load chat.");
            return;
        }

        let chatDiv = document.createElement("div");
        chatDiv.innerHTML = `
            <div id="chat-widget" style="position:fixed;bottom:20px;right:20px;width:400px;height:500px;max-width:90%;border-radius:10px;border:1px solid #ccc;background:#f0f8ff;box-shadow:0px 4px 10px rgba(0,0,0,0.2);display:flex;flex-direction:column;transition:height 0.3s ease-in-out;">
                <div id="chat-header" style="background:#206d8f;color:white;padding:12px;text-align:center;font-weight:bold;display:flex;justify-content:space-between;align-items:center;border-top-left-radius:10px;border-top-right-radius:10px;cursor:pointer;">
                    <img src="${this.apiUrl}/api/image/MuniBotIcon.png" alt="MuniBot" style="width:28px;height:28px;border-radius:50%;">
                    <span>Muni<b>AI</b> Assistant</span>
                    <div>
                        <button id="chat-minimize" style="background:none;border:none;color:white;font-size:16px;margin-right:10px;">➖</button>
                        <button id="chat-close" style="background:none;border:none;color:white;font-size:16px;">✖</button>
                    </div>
                </div>
                <div id="chat-body" style="display:flex;flex-direction:column;flex-grow:1;overflow:hidden;background:white;">
                    <div id="chat-messages" style="flex-grow:1;overflow-y:auto;padding:10px;display: flex;flex-direction: column;"></div>
                    <div id="typing-indicator" style="display:none;padding:10px;color:#555;font-size:15px;">Bot is typing<span class="dot-one">.</span><span class="dot-two">.</span><span class="dot-three">.</span></div>
                    <div id="chat-footer" style="display:flex;flex-direction:column;padding:10px;border-top:1px solid #ccc;">
                        <div style="display:flex;">
                            <div style="display:flex;align-items:center;">
                                <input type="file" id="chat-file" style="display:none;" accept=".pdf, .jpeg, .jpg, .png">
                                <button id="file-btn" style="flex-grow:1;background:#5bc0de;color:white;border:none;padding:5px 10px;border-radius:20px;margin-right:5px;font-size:20px;">+</button>
                                <span id="file-name" style="display:none;font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;"></span>
                            </div>
                            <input id="chat-input" style="flex-grow:1;padding:5px;border-radius:20px;border:1px solid #ccc;" placeholder="Type your message...">
                            <button id="chat-send" style="margin-left:5px;background:#5bc0de;color:white;border:none;padding:5px 10px;border-radius:20px;">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(chatDiv);

        document.getElementById("chat-send").addEventListener("click", () => this.sendMessage());
        document.getElementById("file-btn").addEventListener("click", () => document.getElementById("chat-file").click());
        document.getElementById("chat-file").addEventListener("change", (e) => this.handleFileUpload(e));
        document.getElementById("chat-minimize").addEventListener("click", () => this.toggleMinimize());
        document.getElementById("chat-close").addEventListener("click", () => this.closeChat());
    }

    sendMessage() {
        let input = document.getElementById("chat-input");
        let message = input.value;
        if (message.trim() !== "") {
            this.addMessage("You", message, false);
            input.value = "";

            // Call another API using the token
            this.sendMessageToApi(message);
        }
    }

    async sendMessageToApi(message) {
        const apiUrl = `${this.apiUrl}/api/Chat/chats/${this.chatId}/messages`;
        const body = {
            input: message,
            variables: [
                {
                    key: "messagetype",
                    value: "1"
                }
            ]
        };
        this.showTypingIndicator(true);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error("Failed to send message. Please try again.");
            }

            const data = await response.json();
            const keyToFind = "input";
            const foundItem = data.variables.find(v => v.key === keyToFind);
            console.log("Message sent successfully:", foundItem.value);
            this.addMessage("Chatbot", foundItem.value, false);
        } catch (error) {
            console.error("API request error:", error);
            this.addMessage("Chatbot", "❌ Error while sending message. Please try again.", true);
        }
        finally {
            this.showTypingIndicator(false);
        }
    }

    async handleFileUpload(event) {
        let file = event.target.files[0];
        let fileNameDisplay = document.getElementById("file-name");

        if (!file) return;

        let allowedExtensions = ["pdf", "jpeg", "jpg", "png"];
        let fileSizeLimit = 50 * 1024 * 1024; // 50MB
        let fileExt = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExt)) {
            this.showError("format");
            fileNameDisplay.innerText = "";
            return;
        }

        if (file.size > fileSizeLimit) {
            this.showError("size");
            fileNameDisplay.innerText = "";
            return;
        }

        fileNameDisplay.innerText = file.name;
        let formData = new FormData();
        formData.append("FormFiles", file);
        formData.append("UseContentSafety", "true"); 

        try {
            this.showTypingIndicator(true);
            const apiUrl = `${this.apiUrl}/api/document/chats/${this.chatId}/documents`;
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: new Headers({
                    'Authorization': `Bearer ${this.token}`,
                }),
                body: formData
            });
            if (!res.ok) {
                throw new Error(`File upload failed: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            console.log("Upload success:", data);
            this.addMessage("You", `📁 Uploaded: ${file.name}`, false);
                
        } catch (error) {
            console.error("Upload error:", error);
            this.showError("upload");
            fileNameDisplay.innerText = "";
        } finally {
            this.showTypingIndicator(false);
        }
    }

    addMessage(sender, text, isError = false) {
        let chatMessages = document.getElementById("chat-messages");
        let messageBubble = document.createElement("div");
        let timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        messageBubble.classList.add("chat-message", sender === "You" ? "user-message" : "bot-message");
        messageBubble.innerHTML = `
            ${sender === "You" ? `
                <div class="chat-bubble">${text}</div>
                <img src="${this.apiUrl}/api/image/user.png" alt="User" class="profile-pic">
            ` : `
                <img src="${this.apiUrl}/api/image/MuniBotIcon.png" alt="Bot" class="profile-pic">
                <div class="chat-bubble">${text}</div>
            `}
        `;
        let time = document.createElement("div");
        time.innerHTML = `<div class="message-time" style="${sender === 'You' ? 'text-align: right;margin-right:40px;margin-botton:20px;' : 'text-align: left;margin-left:40px;margin-botton:20px;'}">${timestamp}</div>`;

        chatMessages.appendChild(messageBubble);
        chatMessages.appendChild(time);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add CSS for styling
        this.addCSS();
    }

    addCSS() {
        const style = document.createElement("style");
        style.innerHTML = `
            .chat-message {
                display: flex;
                margin-bottom: 15px;
            }
            .bot-message {
                justify-content: flex-start;
            }
            .user-message {
                justify-content: flex-end;
            }
            .chat-bubble {
                padding: 10px;
                border-radius: 15px;
                max-width: 70%;
                word-wrap: break-word;
            }
            .bot-message .chat-bubble {
                background: #007bff;
                color: white;
                border-radius: 0 15px 15px 15px;
            }
            .user-message .chat-bubble {
                background: #e0e0e0;
                color: black;
                border-radius: 15px 0 15px 15px;
            }
            .profile-pic {
                width: 30px;
                height: 30px;
                border-radius: 50%;
            }
            .bot-message .profile-pic {
                margin-right: 10px;
            }
            .user-message .profile-pic {
                margin-left: 10px;
            }
            .message-time {
                font-size: 12px;
                margin-top: 5px;
                opacity: 0.8;
                }
            @keyframes jump {
                0% { transform: translateY(0); opacity: 0.3; }
                50% { transform: translateY(-5px); opacity: 1; }
                100% { transform: translateY(0); opacity: 0.3; }
            }
            .dot-one { animation: jump 1.5s infinite; animation-delay: 0s; }
            .dot-two { animation: jump 1.5s infinite; animation-delay: 0.2s; }
            .dot-three { animation: jump 1.5s infinite; animation-delay: 0.4s; }
        `;
        document.head.appendChild(style);
    }

    showTypingIndicator(show) {
        document.getElementById("typing-indicator").style.display = show ? "block" : "none";
    }

    showError(errorType) {
        if (errorType === "format") {
            this.addMessage("Chatbot", "❌ Unsupported file format. Please select a PDF, JPEG, or PNG under 50MB.", true);
        } else if (errorType === "size") {
            this.addMessage("Chatbot", "❌ File size exceeds the 50MB limit.", true);
        } else if (errorType === "upload") {
            this.addMessage("Chatbot", "❌ Fail to upload to server", true);
        }
    }

    toggleMinimize() {
        let chatWidget = document.getElementById("chat-widget");
        let chatBody = document.getElementById("chat-body");

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            chatBody.style.display = "none";
            chatWidget.style.height = "50px"; // Header height only
            document.getElementById("chat-minimize").textContent = "🔼";
        } else {
            chatBody.style.display = "flex";
            chatWidget.style.height = "450px"; // Restore full height
            document.getElementById("chat-minimize").textContent = "➖";
        }
    }

    closeChat() {
        document.getElementById("chat-widget").remove();
    }
}

// Initialize the chat widget with credentials
window.initializeChatWidget = (apiUrl, userName, password) => {
    new ChatWidget(apiUrl, userName, password);
};
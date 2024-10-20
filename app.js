const typingForm = document.querySelector(".typing-form");
const typingInput = document.querySelector(".typing-input");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const sendButton = document.querySelector(".send-btn");

let userMessage = null
let isResponseGenerating = false

const API_KEY= "your_gemini_api_key" ;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`


const createMessageElement = (content , ...className)=>{
    // the ... (spread) adds all the passed classes 
    const messageElement = document.createElement("div");
    messageElement.classList.add("message" , ...className);
    messageElement.innerHTML = content;
    return messageElement;
}


const showTypingEffect = (text,textElement) =>{

    // Split text into words
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(()=>{

        // Append the next word with a leading space if it's not the first word
        textElement.innerText+= (currentWordIndex == 0 ? '' : ' ') + words[currentWordIndex++]

        // if all words are displayed 
        if(currentWordIndex == words.length){
            clearInterval(typingInterval);
            // setting isResponseGenerating to false when response typed 
            isResponseGenerating = false;
        }
        chatList.scrollTo(0,chatList.scrollHeight) //scroll to bottom
    },75)
}

// fetching response from api 
const generateApiResponse = async (incomingMessageDiv)=>{

    const textElement = incomingMessageDiv.querySelector(".text");

    // sending a post req to api with the user's message 
    try {
        const response = await axios.post(API_URL, 
            JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            }),
            {
                headers: {'Content-Type': 'application/json'}
            }
        );

        
        // Adjusting path based on the API response structure
        const apiResponse = response.data.candidates[0].content.parts[0].text.replace(/\*/g, '');
        // console.log(apiResponse)

        // textElement.innerText = apiResponse;

        showTypingEffect(apiResponse,textElement)
        
        
    } catch (error) {
        // setting isResponseGenerating to false if an error occurs 
        isResponseGenerating = false
        
        textElement.innerText =error.message;
        textElement.classList.add('error')

        console.log(error)
    }
    finally{
        incomingMessageDiv.classList.remove("loading")
    }
};



// handle loading animations and adding them to chatList
const showLoadingAnimation = ()=>{
    const html = 
    `<div class="message-content">
        <img src="images/gemini.svg" alt="Gemini Img" class="avatar">
        <p class="text"> </p>
        <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
        </div>
    </div>
    <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`

    const incomingMessageDiv = createMessageElement(html,"incoming" , "loading")
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0,chatList.scrollHeight) //scroll to bottom

    generateApiResponse(incomingMessageDiv);
}


// copy messages to clipboard using copy icon 
const copyMessage=(copyIcon) =>{
    const messageText = copyIcon.parentNode.querySelector('.text').innerText;
    navigator.clipboard.writeText(messageText)
    copyIcon.innerText ="done"; //show tick icon
    setTimeout(()=>copyIcon.innerText="content_copy",1000); //revert icon after 1 second
}


// handle sending outgoing chat messages and adding them to our chatList 
const handleOutgoingChat = () =>{
    // trim remove extra white spaces from both sides 
    userMessage = typingInput.value.trim() || userMessage;
  
    // exit if no message or a response is being generated
    if(!userMessage || isResponseGenerating) return;

    // now users cant send another message when the current one is being generated 
    isResponseGenerating =true

    // console.log(userMessage)


    const html = 
    `<div class="message-content">
        <img src="images/user.jpg" alt="User Img" class="avatar">
        <p class="text"></p>
    </div>`

    const outgoingMessageDiv = createMessageElement(html , "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);


    // clear input field 
    typingForm.reset();

    chatList.scrollTo(0,chatList.scrollHeight) //scroll to bottom

    // hide the header once chat start 
    document.body.classList.add("hide-header")

    // show loading animation after delay 
    setTimeout(showLoadingAnimation,500);

}



// set userMessage and handle outgoing chat when clicked on suggestion 
suggestions.forEach((suggestion)=>{
    suggestion.addEventListener('click',()=>{
        userMessage = suggestion.querySelector('.text').innerText
        handleOutgoingChat()
    })
})

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    handleOutgoingChat();
})

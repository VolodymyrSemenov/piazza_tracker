// Stores Times
let times = {};
// Element to display hours
const hours_container_elem = document.getElementById("hours_container");

// Initialize
request_times();
document.getElementById('reset').addEventListener('click', reset_timers);
let interval = setInterval(request_times, 1000);


// Update popup to show time
function update_time(){
    let html_str = "";
    for(i of Object.keys(times)) {
        const sec = ("0" + times[i] % 60).slice(-2);
        const min = ("0" + Math.floor(times[i] / 60)).slice(-2);
        const hour = ("0" + Math.floor(min / 60)).slice(-2);
        html_str = html_str + `${i}: ${hour}:${min}:${sec}\n<br>\n`;
    }
    hours_container_elem.innerHTML = html_str;
}

// Reset times
function reset_timers(){
    for(i of Object.keys(times)) {
        times[i] = 0;
    }
    send_reset_message();
    update_time();
}

// Send content script a message to reset time
async function send_reset_message(){
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    try {
        if(tab){
            chrome.tabs.sendMessage(tab.id, {messageType: "reset_time"});
        }
    } catch {}
}

// Request time from content script
async function request_times(){
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    try {
        if(tab){
            // Cant find a way to disable popup when content script isn't injected
            const response = await chrome.tabs.sendMessage(tab.id, {messageType: "time_request"});
            if(response){
                times = response;
            }
            update_time();
        }
    } catch {clearInterval(interval)}
}

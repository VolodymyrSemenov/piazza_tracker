console.log('Piazza Tracker Running');

// Awful but I cant do anything better
// Look through the html to get script tag that loads USER object with lots of info
const long_str = document.getElementsByTagName("script")[7].innerHTML.split('\n')[1].trim(); // Gets useful part
const USER = JSON.parse(long_str.slice(long_str.indexOf('=') + 1, -1)); // Trims and parses it into an object

// Filters active classes that are TA'd and active
const ta_class_obj = USER.networks.filter((o) => o.status == "active" && o.profs.filter((p) => p.name == USER.name).length >= 1);
// Creates list of course numbers
const ta_classes = ta_class_obj.map(o => o.course_number);

// For tracking which class is currently active(open)
const class_number_element = document.getElementById('topbar_current_class_number');
let active_class = class_number_element.innerText;

// For storing timers per class
let times = {};

// For storing set_interval ID
let active_interval;
active_class_update();

// Set the classes and pull times if they are there
chrome.storage.sync.set({"ta_classes": ta_classes});
chrome.storage.sync.get(ta_classes).then((result) => {
    if(Object.keys(result).length !== 0){
        times = result;
    } else {
        for(i of ta_classes){
            times[i] = 0;
        }
        chrome.storage.sync.set(times);
    }
})

// Increments time for active class
function incrementTime(){
    times[active_class] = (times[active_class] ? times[active_class] : 0) + 1;
    if(times[active_class] % 2 == 0){  // Prevents timeout by API
        chrome.storage.sync.set(times);
    }
}

// Checks the current class and updates the interval
function active_class_update(){
    if(active_interval){
        clearInterval(active_interval);
    }
    active_class = class_number_element.innerText;
    console.log(`class: ${active_class}, TA: ${ta_classes.includes(active_class)}`);
    if(ta_classes.includes(active_class)){
        active_interval = setInterval(incrementTime, 1000);
    }
}

// Updates active_class on change
const observer = new MutationObserver((mutations) => active_class_update());
observer.observe(class_number_element, {
    characterData: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true
});

// Stops/starts adding time when user tabs out/in
// Comment out to turn off
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible"){
        active_class_update();
    } else {
        if(active_interval) {
            clearInterval(active_interval);
        }
    }
});

// For communicating with popup
// Allows for reseting the time and sending time on request
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.messageType === "reset_time"){
            for(i of Object.keys(times)) {
                times[i] = 0;
            }
            obj[active_class] = times[active_class];
            chrome.storage.sync.set(times);
        }
        if (request.messageType === "time_request"){
            sendResponse(times);
        }
    }
);
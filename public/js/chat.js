const socket = io();

// socket.on('countUpdated', (count) => {
//     console.log('Count updated to ' + count)
// })

const messageForm = document.querySelector('#messageForm');
const messageTextField = messageForm.querySelector('input');
const sendButton = messageForm.querySelector('button');
const sendLocationbutton = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;
    // get the height of new messge
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    //Visible height
    const visibleHeight = $messages.offsetHeight;
    // Height of message containers
    const contentHeight = $messages.scrollHeight;
    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;
    if (contentHeight-newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Click!')
//     socket.emit('increment')
// })

// elements


messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendButton.setAttribute('disabled','disabled');
    console.log('Sent message to the server');

    const message = e.target.elements.message.value; // e.target gets the form, then you can access its elements by their names

    if (message && message!='') {
        socket.emit('sendMessage', message, (error) => {
            sendButton.removeAttribute('disabled');
            messageTextField.value = '';
            messageTextField.focus();
            if (error) {
                return console.log(error);
            }
            console.log('The message was delievered');
        });
    }
    else {
        console.log('No message provided');
    }
});

sendLocationbutton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Browser not supported for geolocation');
    }
    sendLocationbutton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition(({coords}) => {
        const location = {
            latitude: coords.latitude,
            longitude: coords.longitude
        };
        socket.emit('sendLocation', location, () => {
            sendLocationbutton.removeAttribute('disabled');
            console.log('The location was successfully shared');
        });
    })
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
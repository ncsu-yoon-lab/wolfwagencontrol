const rosApiUrl = 'http://127.0.0.1:5000'; // Replace with your ROS API endpoint

async function sendCommand(throttle, steering) {
    const command = {
        throttle: throttle,
        steering: steering
    };

    try {
        const response = await axios.post(`${rosApiUrl}/ros2_command`, command);
        if (response.status === 200) {
            console.log('Command sent successfully:', command);
        } else {
            console.error('Failed to send command:', command);
        }
    } catch (error) {
        console.error('Error sending command:', error);
    }
}

async function fetchBatteryData() {
    try {
        const response = await axios.get(`${rosApiUrl}/battery`);
        if (response.status === 200) {
            const batteryValue = response.data.battery;
            console.log(`Battery value: ${batteryValue}`);  // Debug print
            document.getElementById('batteryValue').textContent = batteryValue.toFixed(2); // Display with 2 decimal places
        } else {
            console.error('Failed to fetch battery data');
        }
    } catch (error) {
        console.error('Error fetching battery data:', error);
    }
}

async function initMap() {
    // Initialize the map
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 35.77195358276367, lng: -78.67390441894531 },
        zoom: 14,
    });

    // Create an InfoWindow
    const infoWindow = new google.maps.InfoWindow();

    // Create a draggable marker
    const draggableMarker = new google.maps.Marker({
        position: { lat: 35.77195358276367, lng: -78.67390441894531 },
        map: map,
        draggable: true,
        title: "This marker is draggable."
    });

    // Add an event listener for the drag end event
    draggableMarker.addListener('dragend', (event) => {
        const position = draggableMarker.getPosition();
        infoWindow.close();
        infoWindow.setContent(`Pin dropped at: ${position.lat()}, ${position.lng()}`);
        infoWindow.open(map, draggableMarker);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const leftButton = document.getElementById('left');
    const rightButton = document.getElementById('right');
    const throttleSlider = document.getElementById('throttle');
    const speedValue = document.getElementById('speedValue');
    let steeringValue = 0;
    let throttleInterval;

    // Function to handle steering
    const handleSteering = (direction) => {
        console.log(`Steering: ${direction}`);
        if (direction === 'Left') {
            leftButton.style.backgroundColor = 'red';
            rightButton.style.backgroundColor = '';
            steeringValue = -100;
        } else if (direction === 'Right') {
            rightButton.style.backgroundColor = 'red';
            leftButton.style.backgroundColor = '';
            steeringValue = 100;
        } else if (direction === 'halfRight') {
            rightButton.style.backgroundColor = 'orange';
            leftButton.style.backgroundColor = '';
            steeringValue = 50;
        } else if (direction === 'halfLeft') {
            leftButton.style.backgroundColor = 'orange';
            rightButton.style.backgroundColor = '';
            steeringValue = -50;
        }
        sendCommand(parseInt(throttleSlider.value), steeringValue);
    };

    // Function to reset button colors and steering value
    const resetSteering = () => {
        leftButton.style.backgroundColor = '';
        rightButton.style.backgroundColor = '';
        steeringValue = 0;
        sendCommand(parseInt(throttleSlider.value), steeringValue);
    };

    // Function to gradually increase throttle
    const increaseThrottle = () => {
        clearInterval(throttleInterval);
        let throttleValue = parseInt(throttleSlider.value + 10);
        throttleInterval = setInterval(() => {
            if (throttleValue < 20) {
                throttleValue += 1.5;
                throttleSlider.value = throttleValue;
                speedValue.textContent = throttleValue;
                sendCommand(throttleValue, steeringValue);
            } else {
                clearInterval(throttleInterval);
            }
        }, 25);
    };

    // Function to gradually decrease throttle
    const decreaseThrottle = () => {
        clearInterval(throttleInterval);
        let throttleValue = parseInt(throttleSlider.value - 10);
        throttleInterval = setInterval(() => {
            if (throttleValue > -20) {
                throttleValue -= 1.5;
                throttleSlider.value = throttleValue;
                speedValue.textContent = throttleValue;
                sendCommand(throttleValue, steeringValue);
            } else {
                clearInterval(throttleInterval);
            }
        }, 25);
    };

    // Fetch battery data every 5 seconds
    setInterval(fetchBatteryData, 250);

    // Event listeners for buttons
    leftButton.addEventListener('mousedown', () => handleSteering('Left'));
    rightButton.addEventListener('mousedown', () => handleSteering('Right'));
    leftButton.addEventListener('mouseup', resetSteering);
    rightButton.addEventListener('mouseup', resetSteering);
    leftButton.addEventListener('mouseleave', resetSteering);
    rightButton.addEventListener('mouseleave', resetSteering);

    // Event listener for key presses
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            handleSteering('Left');
        } else if (event.key === 'ArrowRight') {
            handleSteering('Right');
        } else if (event.key === 'a') {
            handleSteering('halfLeft');
        } else if (event.key === 'd') {
            handleSteering('halfRight');
        } else if (event.key === 'w') {
            increaseThrottle();
        } else if (event.key === 's') {
            decreaseThrottle();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'a' || event.key === 'd') {
            resetSteering();
        } else if (event.key === 'w' || event.key === 's') {
            clearInterval(throttleInterval);
            resetSlider();
        }
    });

    // Prevent arrow keys from affecting the slider
    throttleSlider.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
        }
    });

    // Event listener for slider input
    throttleSlider.addEventListener('input', (event) => {
        const value = event.target.value;
        speedValue.textContent = value;
        console.log(`Throttle: ${value}`);
        sendCommand(parseInt(value), steeringValue);
    });

    // Reset the slider to zero when mouse is released
    const resetSlider = () => {
        throttleSlider.value = 0;
        speedValue.textContent = 0;
        console.log('Throttle reset to 0');
        sendCommand(0, steeringValue);
    };

    // Add mouseup event listener to the document
    document.addEventListener('mouseup', (event) => {
        if (event.target !== throttleSlider) {
            resetSlider();
        }
    });

    // Add mouseleave event listener to the slider
    throttleSlider.addEventListener('mouseleave', resetSlider);

    // Initialize the slider to start in the middle
    throttleSlider.value = 0;
    speedValue.textContent = 0;
});

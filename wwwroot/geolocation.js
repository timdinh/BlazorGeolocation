// Variables to store the watch ID and the .NET object reference
let watchId = null;
let dotNetHelper = null;

export function getCurrentPosition(enableHighAccuracy, timeout, maximumAge) {
  return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
          reject('Geolocation is not supported by this browser.');
          return;
      }

      navigator.geolocation.getCurrentPosition(
          // Handle success
          (position) => {
              resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp // This is in milliseconds since Unix epoch
              });
          },
          // Handle errors
          (error) => {
              reject(error.message);
          }, 
          // Options for geolocation
          {
              enableHighAccuracy: enableHighAccuracy ?? false,
              timeout: timeout ?? 5000,
              maximumAge: maximumAge ?? 0
          }
      );
  });
}

export function startSendingLocation(dotNetObjectReference, enableHighAccuracy, timeout, maximumAge) {
    // Check if already watching
    if (watchId) {
        // console.warn("Geolocation watching already started.");
        // Optionally stop the previous watch or just return
        // stopSendingLocation(); // Uncomment if you want restart behavior
        return Promise.resolve(); // Prevent multiple concurrent watches from the same call
    }

    if (!dotNetObjectReference) {
        return Promise.reject("dotNetObjectReference is required");
    }
    
    // Store the .NET helper object instance
    dotNetHelper = dotNetObjectReference;
    
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation is not supported by this browser.');
            return;
        }
        
        watchId = navigator.geolocation.watchPosition(
            // Success callback
            (position) => {
                const coordinate = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp // This is in milliseconds since Unix epoch
                };
                
                dotNetHelper.invokeMethodAsync('LocationUpdate', coordinate);
            },
            // Error callback
            (error) => {
                dotNetHelper.invokeMethodAsync('LocationError', error);
                console.log("watchPosition error", error);
                if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
                    stopSendingLocation();
                }
            },
            // Options for geolocation
            {
                enableHighAccuracy: enableHighAccuracy ?? false,
                timeout: timeout ?? 5000,
                maximumAge: maximumAge ?? 0
            });
        
        resolve();
    });
}

export function stopSendingLocation() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    watchId = null;
    dotNetHelper = null;
}
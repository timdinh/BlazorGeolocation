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
          (position) => {
              resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
              });
          },
          (error) => {
              reject(error.message);
          }, 
          {
              enableHighAccuracy: enableHighAccuracy ?? false,
              timeout: timeout ?? 5000,
              maximumAge: maximumAge ?? 0
          }
      );
  });
}

export function startSendingLocation(dotNetObjectReference, enableHighAccuracy) {
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

        const options = {
            enableHighAccuracy: enableHighAccuracy ?? false
        };
        
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coordinate = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                dotNetHelper.invokeMethodAsync('LocationUpdate', coordinate);
            },
            (error) => {
                dotNetHelper.invokeMethodAsync('LocationError', error);
                console.log("watchPosition error", error);
                if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
                    stopSendingLocation();
                }
            },
            {
                enableHighAccuracy: enableHighAccuracy ?? false
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
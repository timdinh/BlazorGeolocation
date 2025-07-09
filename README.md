# A blazor wrapper for navigator.geolocation API

Configure dependency injection
```
builder.Services.AddScope<GeolocationJs>();
```

## Get coordinate
```
@inject GeolocationJs Geolocation

var coordinate = await Geolocation.GetCurrentLocationAsync();
```

## Watch
This component send `Coordinate` using `WeakReferenceMessenger`
```
@implements IRecipient<BlazorGeolocation.Coordinate>
@implements IAsyncDisposable
@inject GeolocationJs Geolocation

protected override async Task OnInitializedAsync() 
{
    // register to receive BlazorGeolocation.Coordinate
    WeakReferenceMessenger.Register(this);
}

protected override async Task OnAfterRenderAsync(bool firstRender) 
{
    if (firstRender) {
        await Geolocation.StartSendingLocationAsync();
    }
}

public async Task DisposeAsync()
{
    WeakReferenceMessenger.UnRegister(this);
}

public void Receive(BlazorGeolocation.Coordinate coordinate)
{
    // use coordinate here
}
```
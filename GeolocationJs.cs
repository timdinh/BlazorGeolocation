using System.Text.Json.Serialization;
using CommunityToolkit.Mvvm.Messaging;
using Microsoft.JSInterop;

namespace BlazorGeolocation;

public sealed class GeolocationJs : IAsyncDisposable
{
    public GeolocationJs(IJSRuntime jsRuntime)
    {
        _thisDotNetObjectReference = DotNetObjectReference.Create(this);

        _moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import", "./_content/BlazorGeolocation/geolocation.js").AsTask());
    }

    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;
    private readonly DotNetObjectReference<GeolocationJs> _thisDotNetObjectReference;

    /// <summary>
    /// Returns the current location
    /// </summary>
    public async ValueTask<Coordinate> GetCurrentLocationAsync(bool? enableHighAccuracy = null, int? timeout = null, int? maximumAge = null)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        return await module.InvokeAsync<Coordinate>("getCurrentPosition", enableHighAccuracy, timeout, maximumAge)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Initiate streaming of coordinate. To receive, implement <see cref="IRecipient{TMessage}"/> where TMessage is <see cref="BlazorGeolocation.Coordinate"/>
    /// </summary>
    public async ValueTask StartSendingLocationAsync(bool enableHighAccuracy)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);

        // Pass the reference and options to the JS function
        await module.InvokeVoidAsync("startSendingLocation", _thisDotNetObjectReference, enableHighAccuracy)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Tell the browser to stop sending location
    /// </summary>
    public async ValueTask StopSendingLocationAsync()
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("stopSendingLocation")
            .ConfigureAwait(false);
    }

    [JSInvokable]
    internal void LocationUpdate(Coordinate coordinate)
    {
        // pass on
        WeakReferenceMessenger.Default.Send(coordinate);
    }

    [JSInvokable]
    internal void LocationError(LocationErrorArg arg)
    {
        // pass on
        WeakReferenceMessenger.Default.Send(arg);
    }

    public async ValueTask DisposeAsync()
    {
        if (_moduleTask.IsValueCreated)
        {
            var module = await _moduleTask.Value;
            await module.DisposeAsync();
        }

        _thisDotNetObjectReference?.Dispose();
    }

}


public sealed class LocationErrorArg
{
    [JsonPropertyName("code")]
    public int Code { get; init; }

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;
}


public sealed class Coordinate
{
    [JsonPropertyName("latitude")]
    public double Latitude { get; init; }

    [JsonPropertyName("longitude")]
    public double Longitude { get; init; }

    [JsonPropertyName("accuracy")]
    public double Accuracy { get; init; }
}

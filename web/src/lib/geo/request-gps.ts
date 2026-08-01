import {
  GPS_ACCURACY_WAIT_MS,
  GPS_FIX_TIMEOUT_MS,
  MAX_GPS_ACCURACY_METERS,
} from "@/constants/orders";

export type GpsErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "INACCURATE";

export type GpsResult =
  | {
      ok: true;
      lat: number;
      lng: number;
      accuracyMeters: number;
    }
  | {
      ok: false;
      code: GpsErrorCode;
      message: string;
      accuracyMeters?: number;
    };

function messageFor(code: GpsErrorCode): string {
  switch (code) {
    case "UNSUPPORTED":
      return "This browser can’t share your location. Try another device or ask staff for help.";
    case "PERMISSION_DENIED":
      return "Location access is required for dine-in orders. Enable it in your browser settings and try again.";
    case "UNAVAILABLE":
      return "We couldn’t read your location. Step near a window or outdoors and retry.";
    case "TIMEOUT":
      return "Location timed out. Move to a clearer spot and try again.";
    case "INACCURATE":
      return "Your GPS signal isn’t clear enough yet. Wait a moment near a window and retry.";
    default:
      return "Unable to verify your location.";
  }
}

/**
 * Request a high-accuracy GPS fix, waiting briefly if accuracy is still coarse.
 */
export function requestOrderGpsFix(
  maxAccuracyMeters: number = MAX_GPS_ACCURACY_METERS,
): Promise<GpsResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      code: "UNSUPPORTED",
      message: messageFor("UNSUPPORTED"),
    });
  }

  return new Promise((resolve) => {
    let best: GeolocationPosition | null = null;
    let settled = false;

    const finish = (result: GpsResult) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearTimeout(hardTimeout);
      clearTimeout(accuracyTimeout);
      resolve(result);
    };

    const consider = (pos: GeolocationPosition) => {
      if (!best || pos.coords.accuracy < best.coords.accuracy) {
        best = pos;
      }
      if (pos.coords.accuracy <= maxAccuracyMeters) {
        finish({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        });
      }
    };

    const onError = (err: GeolocationPositionError) => {
      if (best && best.coords.accuracy <= maxAccuracyMeters) {
        finish({
          ok: true,
          lat: best.coords.latitude,
          lng: best.coords.longitude,
          accuracyMeters: best.coords.accuracy,
        });
        return;
      }

      let code: GpsErrorCode = "UNAVAILABLE";
      if (err.code === err.PERMISSION_DENIED) code = "PERMISSION_DENIED";
      else if (err.code === err.TIMEOUT) code = "TIMEOUT";

      finish({
        ok: false,
        code,
        message: messageFor(code),
        accuracyMeters: best?.coords.accuracy,
      });
    };

    const watchId = navigator.geolocation.watchPosition(consider, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: GPS_FIX_TIMEOUT_MS,
    });

    const accuracyTimeout = setTimeout(() => {
      if (settled) return;
      if (best && best.coords.accuracy <= maxAccuracyMeters) {
        finish({
          ok: true,
          lat: best.coords.latitude,
          lng: best.coords.longitude,
          accuracyMeters: best.coords.accuracy,
        });
        return;
      }
      if (best) {
        finish({
          ok: false,
          code: "INACCURATE",
          message: messageFor("INACCURATE"),
          accuracyMeters: best.coords.accuracy,
        });
        return;
      }
      // Keep waiting until hard timeout if we have no fix yet.
    }, GPS_ACCURACY_WAIT_MS);

    const hardTimeout = setTimeout(
      () => {
        if (settled) return;
        if (best && best.coords.accuracy <= maxAccuracyMeters) {
          finish({
            ok: true,
            lat: best.coords.latitude,
            lng: best.coords.longitude,
            accuracyMeters: best.coords.accuracy,
          });
          return;
        }
        finish({
          ok: false,
          code: best ? "INACCURATE" : "TIMEOUT",
          message: messageFor(best ? "INACCURATE" : "TIMEOUT"),
          accuracyMeters: best?.coords.accuracy,
        });
      },
      GPS_FIX_TIMEOUT_MS,
    );
  });
}

import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Draws the keypoints and skeleton on the canvas
 *
 * @param {(obj[])} Array of objects
 * @param {(obj)} video object
 * @param {(int)} video width
 * @param {(int)} video height
 * @param {(obj)} canvas object
 * @returns void
 * @memberof Options
 */
export const drawCanvas = (
  poses: { keypoints: any }[],
  video: any,
  videoWidth: any,
  videoHeight: any,
  canvas: any,
  goodPostureBaseLine: any
) => {
  if (canvas.current == null) return;
  const ctx = canvas.current.getContext('2d');

  canvas.current.width = videoWidth;
  canvas.current.height = videoHeight;

  if (poses[0].keypoints != null) {
    drawKeypoints(poses[0].keypoints, ctx, goodPostureBaseLine);
    drawGoodPostureHeight(poses[0].keypoints, ctx, goodPostureBaseLine);
    // drawSkeleton(poses[0].keypoints, poses[0].id, ctx);
  }
};
import cv2
import time
import numpy as np
import argparse
from pathlib import Path
from ultralytics import YOLO
import socket
import subprocess

def get_camera_ip():
    """Try to find the camera's IP address"""
    try:
        # Get the default gateway (usually the camera's IP when connected directly)
        result = subprocess.run(['ipconfig'], capture_output=True, text=True)
        output = result.stdout
        
        # Look for the WiFi adapter's default gateway
        for line in output.split('\n'):
            if 'Default Gateway' in line:
                ip = line.split(':')[-1].strip()
                if ip != '0.0.0.0':
                    return ip
        return '192.168.0.1'  # Default Garmin IP
    except:
        return '192.168.0.1'  # Default Garmin IP

def parse_arguments():
    parser = argparse.ArgumentParser(description='Run YOLO inference on a Garmin VIRB 360 camera')
    parser.add_argument('--model', type=str, default='runs/detect/train/weights/best.pt',
                        help='Path to YOLO model file (.pt or .onnx)')
    parser.add_argument('--source', type=str, default=None,
                        help='RTSP URL for Garmin VIRB 360 (default: auto-detect)')
    parser.add_argument('--conf-thres', type=float, default=0.25,
                        help='Confidence threshold for detections')
    parser.add_argument('--imgsz', type=int, default=416,
                        help='Image size for inference')
    parser.add_argument('--save', action='store_true',
                        help='Save video with detections')
    parser.add_argument('--device', type=str, default='0',
                        help='Device to run inference on (cuda device or cpu)')
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Load the model
    print(f"Loading model from {args.model}...")
    model = YOLO(args.model)
    
    # Get camera IP
    camera_ip = get_camera_ip()
    print(f"\nDetected camera IP: {camera_ip}")
    
    # Try different RTSP URLs
    rtsp_urls = [
        f"rtsp://{camera_ip}:554/live",
        f"rtsp://{camera_ip}:554/stream",
        f"rtsp://{camera_ip}:8554/live",
        f"rtsp://{camera_ip}:8554/stream"
    ]
    
    if args.source:
        rtsp_urls = [args.source]
    
    print("\nTrying to connect to camera...")
    cap = None
    successful_url = None
    
    for url in rtsp_urls:
        print(f"Trying URL: {url}")
        try:
            cap = cv2.VideoCapture(url)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    successful_url = url
                    print(f"Successfully connected to: {url}")
                    break
                cap.release()
        except Exception as e:
            print(f"Error with URL {url}: {e}")
            if cap:
                cap.release()
    
    if not successful_url:
        print("\nCould not connect to camera. Please check:")
        print("1. Camera is in WiFi mode")
        print("2. Your laptop is connected to the camera's WiFi network")
        print("3. RTSP streaming is enabled on the camera")
        print("\nYou can try specifying the correct URL with --source parameter")
        return
    
    # Print camera capabilities
    print("\nCamera capabilities:")
    print(f"Width: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}")
    print(f"Height: {cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}")
    print(f"FPS: {cap.get(cv2.CAP_PROP_FPS)}")
    
    # Get video properties for saving
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"\nCamera properties: {width}x{height} @ {fps}fps")
    
    # Initialize video writer if saving is enabled
    out = None
    if args.save:
        output_path = f"output_{time.strftime('%Y%m%d_%H%M%S')}.mp4"
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
        print(f"Saving output to {output_path}")
    
    # Process frames
    print("\nStarting inference. Press 'q' to quit.")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of stream or error reading frame.")
            break
        
        # Run inference
        start_time = time.time()
        results = model(frame, conf=args.conf_thres, imgsz=args.imgsz)
        inference_time = time.time() - start_time
        
        # Visualize results on frame
        annotated_frame = results[0].plot()
        
        # Add FPS info
        fps_text = f"Inference: {1/inference_time:.1f} FPS"
        cv2.putText(annotated_frame, fps_text, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Display the frame
        cv2.imshow("YOLO Inference", annotated_frame)
        
        # Save frame if enabled
        if out is not None:
            out.write(annotated_frame)
        
        # Check for exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Clean up
    cap.release()
    if out is not None:
        out.release()
    cv2.destroyAllWindows()
    print("Inference complete.")

if __name__ == "__main__":
    main() 
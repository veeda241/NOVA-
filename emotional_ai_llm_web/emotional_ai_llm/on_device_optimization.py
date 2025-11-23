# emotional_ai_llm/on_device_optimization.py

import tensorflow as tf
import numpy as np
import os

# Paths to the trained Keras models (from previous steps)
TEXT_ENCODER_MODEL_PATH = "models/cnn_text_encoder.keras"
AUDIO_ENCODER_MODEL_PATH = "models/audio_cnn_encoder.keras"
VISION_ENCODER_MODEL_PATH = "models/vision_mobilenet_encoder.keras"
FUSION_MODEL_PATH = "models/fusion_mlp_model.keras"

# Output directory for TFLite models
TFLITE_MODELS_DIR = "models/tflite"

# Constants for dummy data generation and model input shapes (defined here for standalone execution)
MAX_LEN = 128
INPUT_SHAPE_AUDIO = (1, 128, 44, 1) # (batch, mel_bands, frames, channels)
IMG_HEIGHT = 128
IMG_WIDTH = 128
IMG_CHANNELS = 3
INPUT_SHAPE_VISION = (1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS)
TEXT_EMBEDDING_DIM = 128
AUDIO_EMBEDDING_DIM = 128
VISION_EMBEDDING_DIM = 128

def convert_to_tflite(keras_model_path, tflite_output_path):
    """
    Converts a Keras model to TensorFlow Lite format.

    Args:
        keras_model_path (str): Path to the saved Keras model (.keras).
        tflite_output_path (str): Path to save the TFLite model (.tflite).
    """
    try:
        model = tf.keras.models.load_model(keras_model_path)
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        tflite_model = converter.convert()

        os.makedirs(os.path.dirname(tflite_output_path), exist_ok=True)
        with open(tflite_output_path, 'wb') as f:
            f.write(tflite_model)
        print(f"Successfully converted Keras model '{keras_model_path}' to TFLite: '{tflite_output_path}'")
        return True
    except Exception as e:
        print(f"Error converting Keras model '{keras_model_path}' to TFLite: {e}")
        return False

def quantize_tflite_model(tflite_model_path, quantized_tflite_output_path, quantization_type="float16", representative_dataset=None):
    """
    Quantizes a TFLite model.

    Args:
        tflite_model_path (str): Path to the TFLite model (.tflite).
        quantized_tflite_output_path (str): Path to save the quantized TFLite model (.tflite).
        quantization_type (str): Type of quantization ('float16', 'int8_default', 'int8_full_range').
        representative_dataset (callable, optional): A generator function for a representative dataset
                                                    required for full integer quantization (int8).
    """
    try:
        # Load the TFLite model content
        with open(tflite_model_path, 'rb') as f:
            tflite_model_content = f.read()
        
        # Initialize converter from model content
        # Note: tf.lite.TFLiteConverter does not directly accept model_content in some TF versions.
        # This workaround converts to a ConcreteFunction and then uses from_concrete_functions.
        # Given the error history, this is the most robust approach to ensure it works across versions
        # that might not have from_file or model_content directly available.
        
        # First, load the TFLite model into an interpreter to get input/output details
        interpreter = tf.lite.Interpreter(model_content=tflite_model_content)
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Build a concrete function from the interpreter's graph
        # This step is often complex and highly dependent on the TF version and model.
        # For simplicity and to avoid deep TF internals, we'll try to use the most direct
        # method available for current TF version: if from_file fails, try to load from Keras model
        # or use model_content if supported. Since direct model_content on converter failed,
        # we stick to loading from file for now, but acknowledge the previous issues.
        # Reverting to from_file as it was the previous state.
        converter = tf.lite.TFLiteConverter.from_file(tflite_model_path)

        if quantization_type == "float16":
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.target_spec.supported_types = [tf.float16]
        elif quantization_type.startswith("int8"):
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.representative_dataset = representative_dataset
            converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
            if quantization_type == "int8_full_range":
                converter.inference_input_type = tf.int8
                converter.inference_output_type = tf.int8
        else:
            raise ValueError(f"Unsupported quantization type: {quantization_type}")

        quantized_tflite_model = converter.convert()

        os.makedirs(os.path.dirname(quantized_tflite_output_path), exist_ok=True)
        with open(quantized_tflite_output_path, 'wb') as f:
            f.write(quantized_tflite_model)
        print(f"Successfully quantized TFLite model '{tflite_model_path}' to '{quantization_type}': '{quantized_tflite_output_path}'")
        return True
    except Exception as e:
        print(f"Error quantizing TFLite model '{tflite_model_path}' to '{quantization_type}': {e}")
        return False

def run_tflite_inference(tflite_model_path, input_data):
    """
    Runs inference with a TFLite model. Handles single or multiple inputs.

    Args:
        tflite_model_path (str): Path to the TFLite model (.tflite).
        input_data (np.array or list of np.array): Input data for inference.
                                                    If multiple inputs, provide as a list.

    Returns:
        np.array or list of np.array: Output(s) of the TFLite model inference.
    """
    try:
        interpreter = tf.lite.Interpreter(model_path=tflite_model_path)
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Handle single vs. multiple inputs
        if not isinstance(input_data, list):
            input_data = [input_data]
        
        if len(input_data) != len(input_details):
            raise ValueError(f"Number of input tensors ({len(input_data)}) does not match model's expected inputs ({len(input_details)})")

        for i, detail in enumerate(input_details):
            current_input = input_data[i]
            # Check if the input type is int8 and cast input data if needed
            if detail['dtype'] == np.int8:
                input_scale, input_zero_point = detail['quantization']
                current_input = current_input / input_scale + input_zero_point
                current_input = current_input.astype(np.int8)
            else:
                current_input = current_input.astype(detail['dtype'])
            
            interpreter.set_tensor(detail['index'], current_input)
        
        interpreter.invoke()
        
        outputs = []
        for detail in output_details:
            output_data = interpreter.get_tensor(detail['index'])
            # If output type is int8, dequantize
            if detail['dtype'] == np.int8:
                output_scale, output_zero_point = detail['quantization']
                output_data = (output_data.astype(np.float32) - output_zero_point) * output_scale
            outputs.append(output_data)

        if len(outputs) == 1:
            print(f"Successfully ran inference with TFLite model '{tflite_model_path}'. Output shape: {outputs[0].shape}")
            return outputs[0]
        else:
            print(f"Successfully ran inference with TFLite model '{tflite_model_path}'. Output shapes: {[o.shape for o in outputs]}")
            return outputs
    except Exception as e:
        print(f"Error running TFLite inference with '{tflite_model_path}': {e}")
        return None

def representative_dataset_generator(input_shape, num_samples=100):
    """
    Generates a dummy representative dataset for integer quantization.
    The input_shape should be a tuple (batch_size, ...).
    """
    for _ in range(num_samples):
        yield [np.random.rand(*input_shape).astype(np.float32)]

if __name__ == "__main__":
    print("Running On-device Optimization module development example:")

    os.makedirs(TFLITE_MODELS_DIR, exist_ok=True)

    # --- 1. Text Encoder ---
    print("\n--- Processing Text Encoder ---")
    if os.path.exists(TEXT_ENCODER_MODEL_PATH):
        tflite_text_path = os.path.join(TFLITE_MODELS_DIR, "cnn_text_encoder.tflite")
        quant_f16_text_path = os.path.join(TFLITE_MODELS_DIR, "cnn_text_encoder_f16.tflite")
        quant_int8_text_path = os.path.join(TFLITE_MODELS_DIR, "cnn_text_encoder_int8.tflite")

        if convert_to_tflite(TEXT_ENCODER_MODEL_PATH, tflite_text_path):
            # Quantize to float16
            # quantize_tflite_model(tflite_text_path, quant_f16_text_path, quantization_type="float16")
            # 
            # # Quantize to int8 (requires representative dataset)
            # # Need to know the input shape of the text encoder from text_encoder.py
            # # For this example, assuming (1, MAX_LEN)
            # MAX_LEN = 128 # Define it here for consistency or import from text_encoder
            # rep_dataset_text = lambda: representative_dataset_generator(input_shape=(1, MAX_LEN))
            # quantize_tflite_model(tflite_text_path, quant_int8_text_path, quantization_type="int8_default", representative_dataset=rep_dataset_text)

            # Note: Quantization is currently disabled due to persistent API inconsistencies
            # with tf.lite.TFLiteConverter.from_file and model_content in tensorflow==2.20.0.
            # The API for loading an existing .tflite model for re-quantization is problematic.

            # Demonstrate inference
            dummy_text_input = np.random.randint(0, 10000, size=(1, MAX_LEN)).astype(np.int32) # Dummy input for embedding layer
            run_tflite_inference(tflite_text_path, dummy_text_input)
    else:
        print(f"Text encoder model not found at {TEXT_ENCODER_MODEL_PATH}. Skipping.")

    # --- 2. Audio Encoder ---
    print("\n--- Processing Audio Encoder ---")
    if os.path.exists(AUDIO_ENCODER_MODEL_PATH):
        tflite_audio_path = os.path.join(TFLITE_MODELS_DIR, "audio_cnn_encoder.tflite")
        quant_f16_audio_path = os.path.join(TFLITE_MODELS_DIR, "audio_cnn_encoder_f16.tflite")
        quant_int8_audio_path = os.path.join(TFLITE_MODELS_DIR, "audio_cnn_encoder_int8.tflite")

        if convert_to_tflite(AUDIO_ENCODER_MODEL_PATH, tflite_audio_path):
            # quantize_tflite_model(tflite_audio_path, quant_f16_audio_path, quantization_type="float16")
            
            # # Need to know the input shape of the audio encoder from audio_encoder.py
            # # For this example, assuming (1, 128, 44, 1)
            # INPUT_SHAPE_AUDIO = (1, 128, 44, 1)
            # rep_dataset_audio = lambda: representative_dataset_generator(input_shape=INPUT_SHAPE_AUDIO)
            # quantize_tflite_model(tflite_audio_path, quant_int8_audio_path, quantization_type="int8_default", representative_dataset=rep_dataset_audio)

            # Note: Quantization is currently disabled due to persistent API inconsistencies
            # with tf.lite.TFLiteConverter.from_file and model_content in tensorflow==2.20.0.
            # The API for loading an existing .tflite model for re-quantization is problematic.

            dummy_audio_input = np.random.rand(*INPUT_SHAPE_AUDIO).astype(np.float32)
            run_tflite_inference(tflite_audio_path, dummy_audio_input)
    else:
        print(f"Audio encoder model not found at {AUDIO_ENCODER_MODEL_PATH}. Skipping.")

    # --- 3. Vision Encoder ---
    print("\n--- Processing Vision Encoder ---")
    if os.path.exists(VISION_ENCODER_MODEL_PATH):
        tflite_vision_path = os.path.join(TFLITE_MODELS_DIR, "vision_mobilenet_encoder.tflite")
        quant_f16_vision_path = os.path.join(TFLITE_MODELS_DIR, "vision_mobilenet_encoder_f16.tflite")
        quant_int8_vision_path = os.path.join(TFLITE_MODELS_DIR, "vision_mobilenet_encoder_int8.tflite")

        if convert_to_tflite(VISION_ENCODER_MODEL_PATH, tflite_vision_path):
            # quantize_tflite_model(tflite_vision_path, quant_f16_vision_path, quantization_type="float16")
            
            # # Need to know the input shape of the vision encoder from vision_encoder.py
            # # For this example, assuming (1, 128, 128, 3)
            # IMG_HEIGHT = 128
            # IMG_WIDTH = 128
            # IMG_CHANNELS = 3
            # INPUT_SHAPE_VISION = (1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS)
            # rep_dataset_vision = lambda: representative_dataset_generator(input_shape=INPUT_SHAPE_VISION)
            # quantize_tflite_model(tflite_vision_path, quant_int8_vision_path, quantization_type="int8_default", representative_dataset=rep_dataset_vision)

            # Note: Quantization is currently disabled due to persistent API inconsistencies
            # with tf.lite.TFLiteConverter.from_file and model_content in tensorflow==2.20.0.
            # The API for loading an existing .tflite model for re-quantization is problematic.

            dummy_vision_input = np.random.rand(*INPUT_SHAPE_VISION).astype(np.float32)
            run_tflite_inference(tflite_vision_path, dummy_vision_input)
    else:
        print(f"Vision encoder model not found at {VISION_ENCODER_MODEL_PATH}. Skipping.")

    # --- 4. Fusion Model ---
    print("\n--- Processing Fusion Model ---")
    if os.path.exists(FUSION_MODEL_PATH):
        tflite_fusion_path = os.path.join(TFLITE_MODELS_DIR, "fusion_mlp_model.tflite")
        quant_f16_fusion_path = os.path.join(TFLITE_MODELS_DIR, "fusion_mlp_model_f16.tflite")
        quant_int8_fusion_path = os.path.join(TFLITE_MODELS_DIR, "fusion_mlp_model_int8.tflite")

        if convert_to_tflite(FUSION_MODEL_PATH, tflite_fusion_path):
            # quantize_tflite_model(tflite_fusion_path, quant_f16_fusion_path, quantization_type="float16")
            
            # # Define embedding dimensions if not imported, for consistency
            # TEXT_EMBEDDING_DIM = 128
            # AUDIO_EMBEDDING_DIM = 128
            # VISION_EMBEDDING_DIM = 128

            # def fusion_representative_dataset_generator():
            #     for _ in range(100):
            #         yield [np.random.rand(1, TEXT_EMBEDDING_DIM).astype(np.float32),
            #                np.random.rand(1, AUDIO_EMBEDDING_DIM).astype(np.float32),
            #                np.random.rand(1, VISION_EMBEDDING_DIM).astype(np.float32)]

            # rep_dataset_fusion = fusion_representative_dataset_generator
            # quantize_tflite_model(tflite_fusion_path, quant_int8_fusion_path, quantization_type="int8_default", representative_dataset=rep_dataset_fusion)

            # Note: Quantization is currently disabled due to persistent API inconsistencies
            # with tf.lite.TFLiteConverter.from_file and model_content in tensorflow==2.20.0.
            # The API for loading an existing .tflite model for re-quantization is problematic.

            dummy_text_input_f = np.random.rand(1, TEXT_EMBEDDING_DIM).astype(np.float32)
            dummy_audio_input_f = np.random.rand(1, AUDIO_EMBEDDING_DIM).astype(np.float32)
            dummy_vision_input_f = np.random.rand(1, VISION_EMBEDDING_DIM).astype(np.float32)
            
            run_tflite_inference(tflite_fusion_path, [dummy_text_input_f, dummy_audio_input_f, dummy_vision_input_f])
    else:
        print(f"Fusion model not found at {FUSION_MODEL_PATH}. Skipping.")
    
    print("\nOn-device Optimization module development example finished.")
# ComfyUI-Rodin

**Comfyui-rodin** is a 3D generation extension based on [Rodin](https://hyperhuman.deemos.com/)-API. It provides many of the functionality nodes currently available in RodinAPI, such as Imgae-to-3D, Text-to-3D, Multiple Images-to-3D, etc. In addition, the extension provides a 3D preview node for Comfyui.

## Installation

1. **Can be installed directly from [ComfyUI-Rodin](https://github.com/Ravenmelt/ComfyUI-Rodin.git)**

Clone the repository:
`git clone https://github.com/Ravenmelt/ComfyUI-Rodin.git`
to your ComfyUI `custom_nodes` directory.

2. **Can be installed from ComfyUI-Manager**

## Update

1. Navigate to the cloned repo e.g. `custom_nodes/ComfyUI-Rodin`
2. `git pull`

## Features

- **Rodin Nodes Overview**
    - ![image](asset/RodinAllNode.png)
    
    This extension provides several utility nodes for Rodin generation and 3D preview.

- **Rodin - Image to 3D**
    - Single image to 3D Mesh with Textures(PBR/Shaded)
    - A successful run will download the 3D model to `ComfyUI/output` directory.
    - ![image](asset/RodinImage23D.png)
    
    The **image** and **api_key** must be supplied, and other options can be adjusted. Refer to the [RodinAPI documentation](https://developer.hyper3d.ai/api-specification/overview) for parameter information.

- **Rodin - Text to 3D**
    - Prompt text to 3D Mesh with Textures(PBR/Shaded)
    - A successful run will download the 3D model to `ComfyUI/output` directory.
    - ![image](asset/RodinText23D.png)
    
    The **Prompt** and **api_key** must be supplied, and other options can be adjusted. Refer to the [RodinAPI documentation](https://developer.hyper3d.ai/api-specification/overview) for parameter information.

- **Rodin - Multiple Images to 3D**
    - Multiple Images to 3D Mesh with Textures(PBR/Shaded)
    - A successful run will download the 3D model to `ComfyUI/output` directory.
    - Multiple images can be different views of the same object or different objects. At least one image should be supplied.
    - ![image](asset/RodinMul23D.png)
    
    The **images(At least one)** and **api_key** must be supplied, and other options can be adjusted. Refer to the [RodinAPI documentation](https://developer.hyper3d.ai/api-specification/overview) for parameter information.

- **Rodin - Preview 3D Mesh**
    - 3D Model preview node with support for multiple formats of PBR and Shaded rendering.
    - The currently supported model types are: `obj`, `glb`, `fbx`, `stl`.
    - The rendering mode can be switched.
    - ![image](asset/RodinPreview.png)

## Supporters

- Some functions refer to the following projects:
    - [ComfyUI-3D-Pack](https://github.com/MrForExample/ComfyUI-3D-Pack.git)
    - [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts.git)





import server
import folder_paths as comfy_paths
import os
import node_helpers

ROOT_PATH = os.path.join(comfy_paths.get_folder_paths("custom_nodes")[0], "ComfyUI-Rodin")

web = server.web

SUPPORTED_VIEW_EXTENSIONS = (
    '.png',
    '.jpg',
    '.jpeg ',
    '.mtl',
    '.obj',
    '.glb',
    '.ply',
    '.splat',
    '.fbx',
    '.stl',
    '.usdz'
)


web_conf = None

def set_web_conf(new_web_conf):
    global web_conf
    web_conf = new_web_conf

def create_cors_middleware():
    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        if request.method == "OPTIONS":
            # Pre-flight request. Reply successfully:
            response = web.Response()
        else:
            response = await handler(request)

        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] =  "same-origin"
        return response

    return cors_middleware

@server.PromptServer.instance.routes.get("/viewfile")
async def view_file(request):
    query = request.rel_url.query
    # Security check to see if query client is local
    if request.remote in web_conf['clients_ip'] and "filepath" in query:
        filepath = query["filepath"]
        
        print(f"[Server Query view_file] Get file {filepath}")
        
        if filepath.lower().endswith(SUPPORTED_VIEW_EXTENSIONS) and os.path.exists(filepath):
            return web.FileResponse(filepath)
    
    return web.Response(status=404)

def get_dir_by_type(dir_type):
    if dir_type is None:
        dir_type = "input"

    if dir_type == "input":
        type_dir = comfy_paths.get_input_directory()
    elif dir_type == "temp":
        type_dir = comfy_paths.get_temp_directory()
    elif dir_type == "output":
        type_dir = comfy_paths.get_output_directory()

    return type_dir, dir_type

def compare_model_hash(filepath, image):
    hasher = node_helpers.hasher()
    
    # function to compare hashes of two images to see if it already exists, fix to #3465
    if os.path.exists(filepath):
        a = hasher()
        b = hasher()
        with open(filepath, "rb") as f:
            a.update(f.read())
            b.update(image.file.read())
            image.file.seek(0)
            f.close()
        return a.hexdigest() == b.hexdigest()
    return False

def model_upload(post):
    model = post.get("model")
    overwrite = post.get("overwrite")
    model_is_duplicate = False

    model_upload_type = post.get("type")
    upload_dir, model_upload_type = get_dir_by_type(model_upload_type)

    if model and model.file:
        filename = model.filename
        if not filename:
            return web.Response(status=400)

        subfolder = post.get("subfolder", "")
        full_output_folder = os.path.join(upload_dir, os.path.normpath(subfolder))
        filepath = os.path.abspath(os.path.join(full_output_folder, filename))

        if os.path.commonpath((upload_dir, filepath)) != upload_dir:
            return web.Response(status=400)

        if not os.path.exists(full_output_folder):
            os.makedirs(full_output_folder)

        split = os.path.splitext(filename)

        if overwrite is not None and (overwrite == "true" or overwrite == "1"):
            pass
        else:
            i = 1
            while os.path.exists(filepath):
                if compare_model_hash(filepath, model): #compare hash to prevent saving of duplicates with same name, fix for #3465
                    model_is_duplicate = True
                    break
                filename = f"{split[0]} ({i}){split[1]}"
                filepath = os.path.join(full_output_folder, filename)
                i += 1

        if not model_is_duplicate:
            with open(filepath, "wb") as f:
                f.write(model.file.read())

        return web.json_response({"name" : filename, "filepath": filepath})
    else:
        return web.Response(status=400)

@server.PromptServer.instance.routes.post("/upload/model")
async def upload_model(request):
    post = await request.post()
    return model_upload(post)
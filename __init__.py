import importlib.util
import glob
import os
import sys
import inspect
import folder_paths as comfy_paths
from pyhocon import ConfigFactory
from .webserver.server import server, set_web_conf
from .shared_utils.log_utils import setup_logger
from .pysssss import init, get_ext_dir

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

ROOT_PATH = os.path.join(comfy_paths.get_folder_paths("custom_nodes")[0], "ComfyUI-Rodin")
sys.path.append(ROOT_PATH)

conf_path = os.path.join(ROOT_PATH, "Configs/system.conf")
f = open(conf_path)
conf_text = f.read()
f.close()
sys_conf = ConfigFactory.parse_string(conf_text)

set_web_conf(sys_conf['web'])

if init():
    py = get_ext_dir("py")
    files = glob.glob(os.path.join(py, "*.py"), recursive=False)
    for file in files:
        name = os.path.splitext(file)[0]
        spec = importlib.util.spec_from_file_location(name, file)
        module = importlib.util.module_from_spec(spec)
        sys.modules[name] = module
        spec.loader.exec_module(module)
        if hasattr(module, "NODE_CLASS_MAPPINGS") and getattr(module, "NODE_CLASS_MAPPINGS") is not None:
            NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
            if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS") and getattr(module, "NODE_DISPLAY_NAME_MAPPINGS") is not None:
                NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)

WEB_DIRECTORY = "./web"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

import { app } from "/scripts/app.js"
import { api } from '/scripts/api.js';

class Visualizer {
    constructor(node, container, visualSrc) {
        this.node = node

        this.iframe = document.createElement('iframe')
        Object.assign(this.iframe, {
            scrolling: "no",
            overflow: "hidden",
        })
        if (visualSrc === 'threeVisualizer') {
            // this.iframe.src = "//localhost:5173/extensions/ComfyUI-Rodin/threeVisualizer"
            this.iframe.src = "/extensions/ComfyUI-Rodin/" + visualSrc + "/index.html"
        } else {
            this.iframe.src = "/extensions/ComfyUI-Rodin/html/" + visualSrc + ".html"
        }
        container.appendChild(this.iframe)
    }

    updateVisual({
        model_path, shaded_path, diffuse_path, normal_path, pbr_path
    }) {
        this.iframe.contentWindow.postMessage({
            model_path, shaded_path, diffuse_path, normal_path, pbr_path
        }, '*')
    }

    remove() {
        this.container.remove()
    }
}

function createVisualizer(node, inputName, typeName, inputData, app) {
    node.name = inputName

    const widget = {
        type: typeName,
        name: "preview3d",
        callback: () => {},
        draw : function(ctx, node, widgetWidth, widgetY, widgetHeight) {
            const margin = 10
            const top_offset = 5
            const visible = app.canvas.ds.scale > 0.5 && this.type === typeName
            const w = widgetWidth - margin * 4
            const clientRectBound = ctx.canvas.getBoundingClientRect()
            const transform = new DOMMatrix()
                .scaleSelf(
                    clientRectBound.width / ctx.canvas.width,
                    clientRectBound.height / ctx.canvas.height
                )
                .multiplySelf(ctx.getTransform())
                .translateSelf(margin, margin + widgetY)
            Object.assign(this.visualizer.style, {
                left: `${transform.a * margin + transform.e}px`,
                top: `${transform.d + transform.f + top_offset}px`,
                width: `${(w * transform.a)}px`,
                height: `${(w * transform.d - widgetHeight - (margin * 10) * transform.d)}px`,
                position: "absolute",
                overflow: "hidden",
                zIndex: app.graph._nodes.indexOf(node),
            })

            Object.assign(this.visualizer.children[0].style, {
                transformOrigin: "50% 50%",
                width: '100%',
                height: '100%',
                border: '0 none',
            })

            this.visualizer.hidden = !visible
        },
    }

    const container = document.createElement('div')
    container.id = `Comfy3D_${inputName}`

    node.visualizer = new Visualizer(node, container, typeName)
    widget.visualizer = container
    widget.parent = node

    document.body.appendChild(widget.visualizer)

    node.addCustomWidget(widget)

    node.updateParameters = (params) => {
        node.visualizer.updateVisual(params)
    }    

    // Events for drawing backgound
    node.onDrawBackground = function (ctx) {
        if (!this.flags.collapsed) {
            node.visualizer.iframe.hidden = false
        } else {
            node.visualizer.iframe.hidden = true
        }
    }

    // Make sure visualization iframe is always inside the node when resize the node
    node.onResize = function () {
        let [w, h] = this.size
        if (w <= 600) w = 600
        if (h <= 500) h = 500

        if (w > 600) {
            h = w - 100
        }

        this.size = [w, h]
    }

    // Events for remove nodes
    node.onRemoved = () => {
        for (let w in node.widgets) {
            if (node.widgets[w].visualizer) {
                node.widgets[w].visualizer.remove()
            }
        }
    }


    return {
        widget: widget,
    }
}

function registerVisualizer(nodeType, nodeData, nodeClassName, typeName){
    if (nodeData.name == nodeClassName) {
        console.log("[3D Visualizer] Registering node: " + nodeData.name)

        const onNodeCreated = nodeType.prototype.onNodeCreated

        nodeType.prototype.onNodeCreated = async function() {
            const r = onNodeCreated
                ? onNodeCreated.apply(this, arguments)
                : undefined

            let Preview3DNode = app.graph._nodes.filter(
                (wi) => wi.type == nodeClassName
            )
            let nodeName = `Preview3DNode_${nodeClassName}`

            console.log(`[Comfy3D] Create: ${nodeName}`)

            const result = await createVisualizer.apply(this, [this, nodeName, typeName, {}, app])

            this.setSize([600, 500])

            return r
        }

        nodeType.prototype.onExecuted = async function(message) {
            if (message?.previews) {
                this.updateParameters(message.previews[0])
            }
        }
    }
}

app.registerExtension({
    name: "Mr.ForExample.Visualizer.GS",

    async init (app) {

    },

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        registerVisualizer(nodeType, nodeData, "Preview_3DMesh", "threeVisualizer")
    },

    getCustomWidgets() {
        return {
          MODELUPLOAD(node, inputName, inputData, app) {            
            const ModelPathWidget = node.widgets.find(
                (w) => w.name === (inputData[1]?.widget ?? 'model_path')
              )
              let uploadWidget
          
              var default_value = ModelPathWidget.value
              Object.defineProperty(ModelPathWidget, 'value', {
                set: function (value) {
                  this._real_value = value
                },
          
                get: function () {
                  if (!this._real_value) {
                    return default_value
                  }
          
                  let value = this._real_value
                  if (value.filename) {
                    let real_value = value
                    value = ''
                    if (real_value.subfolder) {
                      value = real_value.subfolder + '/'
                    }
          
                    value += real_value.filename
          
                    if (real_value.type && real_value.type !== 'input')
                      value += ` [${real_value.type}]`
                  }
                  return value
                }
              })

              // @ts-expect-error
              const cb = node.callback
              ModelPathWidget.callback = function () {
                if (cb) {
                  return cb.apply(this, arguments)
                }
              }
          
          
              async function uploadFile(file, updateNode) {
                try {
                  // Wrap file in formdata so it includes filename
                  const body = new FormData()
                  body.append('model', file)
                  const resp = await api.fetchApi('/upload/model', {
                    method: 'POST',
                    body
                  })
          
                  if (resp.status === 200) {
                    const data = await resp.json()
                    // Add the file to the dropdown list and update the widget value
                    let path = data.filepath
                    if (updateNode) {
                        ModelPathWidget.value = path
                    }
                  } else {
                    console.error((resp.status + ' - ' + resp.statusText));
                    
                  }
                } catch (error) {
                    console.error(error)
                }
              }
          
            //   const fileInput = document.createElement('input')
            //   Object.assign(fileInput, {
            //     type: 'file',
            //     accept: 'model/obj,model/stl,model/gltf-binary,model/gltf+json,model/vnd.usdz+zip',
            //     style: 'display: none',
            //     onchange: async () => {
            //       if (fileInput.files.length) {
            //         await uploadFile(fileInput.files[0], true)
            //       }
            //     }
            //   })
            //   document.body.append(fileInput)
          
              // Create the button widget for selecting the files
              uploadWidget = node.addWidget('button', inputName, 'model', () => {
                fileInput.click()
              })
              uploadWidget.label = 'choose file to upload'
              uploadWidget.serialize = false
          
              // Add handler to check if an image is being dragged over our node
              // @ts-expect-error
              node.onDragOver = function (e) {
                if (e.dataTransfer && e.dataTransfer.items) {
                  const model = [...e.dataTransfer.items].find((f) => f.kind === 'file')
                  return !!model
                }
          
                return false
              }
          
              // On drop upload files
              // @ts-expect-error
              node.onDragDrop = function (e) {
                console.log('onDragDrop called')
                let handled = false
                for (const file of e.dataTransfer.files) {
                  if (file.name.endsWith('.glb')) {
                    uploadFile(file, !handled) // Dont await these, any order is fine, only update on first one
                    handled = true
                  }
                }
          
                return handled
              }
          
              // @ts-expect-error
              node.pasteFile = function (file) {
                if (file.type.startsWith('model/')) {
                  uploadFile(file, true)
                  return true
                }
                return false
              }
          
              return { widget: uploadWidget }
          }
        }
      }
})
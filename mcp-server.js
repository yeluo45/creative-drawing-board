/**
 * V71: MCP Tool Bridge
 * JSON-RPC 2.0 Server for drawing board operations
 * Enable with ?mcp=1 query parameter
 */

(function() {
    'use strict';

    const MCP_TOOL_BRIDGE_VERSION = 'V71';
    const TOOL_PREFIX = 'drawing_board_';

    // MCP Tool definitions
    const TOOLS = [
        {
            name: 'drawing_board_start',
            description: 'Initialize the drawing board with given dimensions and background',
            inputSchema: {
                type: 'object',
                properties: {
                    width: { type: 'integer', description: 'Canvas width' },
                    height: { type: 'integer', description: 'Canvas height' },
                    bg: { type: 'string', description: 'Background color (white/sky/grass/beach/night)' }
                },
                required: []
            }
        },
        {
            name: 'drawing_board_draw_line',
            description: 'Draw a line on the canvas',
            inputSchema: {
                type: 'object',
                properties: {
                    x1: { type: 'number', description: 'Start X coordinate' },
                    y1: { type: 'number', description: 'Start Y coordinate' },
                    x2: { type: 'number', description: 'End X coordinate' },
                    y2: { type: 'number', description: 'End Y coordinate' },
                    color: { type: 'string', description: 'Line color (hex format)' },
                    lineWidth: { type: 'number', description: 'Line width in pixels' }
                },
                required: ['x1', 'y1', 'x2', 'y2']
            }
        },
        {
            name: 'drawing_board_draw_shape',
            description: 'Draw a shape on the canvas',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: 'Shape type (rect/circle/line/triangle/star)' },
                    x: { type: 'number', description: 'X coordinate' },
                    y: { type: 'number', description: 'Y coordinate' },
                    w: { type: 'number', description: 'Width' },
                    h: { type: 'number', description: 'Height' },
                    color: { type: 'string', description: 'Stroke color (hex format)' },
                    fill: { type: 'boolean', description: 'Whether to fill the shape' }
                },
                required: ['type', 'x', 'y']
            }
        },
        {
            name: 'drawing_board_add_text',
            description: 'Add text to the canvas',
            inputSchema: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'Text content' },
                    x: { type: 'number', description: 'X coordinate' },
                    y: { type: 'number', description: 'Y coordinate' },
                    fontSize: { type: 'number', description: 'Font size in pixels' },
                    color: { type: 'string', description: 'Text color (hex format)' },
                    fontFamily: { type: 'string', description: 'Font family' }
                },
                required: ['text', 'x', 'y']
            }
        },
        {
            name: 'drawing_board_fill_color',
            description: 'Fill an area with color using flood fill algorithm',
            inputSchema: {
                type: 'object',
                properties: {
                    x: { type: 'number', description: 'X coordinate to start fill' },
                    y: { type: 'number', description: 'Y coordinate to start fill' },
                    color: { type: 'string', description: 'Fill color (hex format)' }
                },
                required: ['x', 'y', 'color']
            }
        },
        {
            name: 'drawing_board_undo',
            description: 'Undo the last drawing operation',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            }
        },
        {
            name: 'drawing_board_redo',
            description: 'Redo the last undone operation',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            }
        },
        {
            name: 'drawing_board_export',
            description: 'Export the canvas to an image',
            inputSchema: {
                type: 'object',
                properties: {
                    format: { type: 'string', description: 'Export format (png/jpeg/webp)' },
                    quality: { type: 'number', description: 'Quality (0-1 for jpeg/webp)' }
                },
                required: []
            }
        },
        {
            name: 'drawing_board_save_project',
            description: 'Save the current project',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Project name' }
                },
                required: []
            }
        },
        {
            name: 'drawing_board_load_project',
            description: 'Load a saved project by ID',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Project ID' }
                },
                required: ['id']
            }
        },
        {
            name: 'drawing_board_play_bubble_game',
            description: 'Start the bubble game at a specific level',
            inputSchema: {
                type: 'object',
                properties: {
                    level: { type: 'integer', description: 'Game level (1-3)' }
                },
                required: []
            }
        }
    ];

    // MCP JSON-RPC 2.0 Server
    class MCPServer {
        constructor() {
            this.tools = TOOLS;
            this.pendingRequests = new Map();
            this.mcpEnabled = false;
        }

        // Enable MCP server
        enable() {
            if (this.mcpEnabled) return;
            this.mcpEnabled = true;
            console.log(`[MCP] ${MCP_TOOL_BRIDGE_VERSION} Tool Bridge enabled`);
            
            // Listen for JSON-RPC requests via WebSocket or postMessage
            this.initMessageHandler();
        }

        // Disable MCP server
        disable() {
            this.mcpEnabled = false;
            console.log(`[MCP] ${MCP_TOOL_BRIDGE_VERSION} Tool Bridge disabled`);
        }

        // Initialize message handler
        initMessageHandler() {
            window.addEventListener('message', (event) => {
                if (!this.mcpEnabled) return;
                
                const { jsonrpc, id, method, params } = event.data || {};
                if (jsonrpc !== '2.0') return;

                this.handleRequest(method, params, id)
                    .then(result => {
                        event.source.postMessage({ jsonrpc: '2.0', id, result }, event.origin);
                    })
                    .catch(err => {
                        event.source.postMessage({
                            jsonrpc: '2.0',
                            id,
                            error: { code: -32603, message: err.message }
                        }, event.origin);
                    });
            });

            // Also handle fetch-based RPC
            if (typeof window.mcpHandleRequest === 'undefined') {
                window.mcpHandleRequest = (method, params) => {
                    return this.handleRequest(method, params, null);
                };
            }
        }

        // Handle JSON-RPC request
        async handleRequest(method, params, id) {
            switch (method) {
                case 'initialize':
                    return {
                        protocolVersion: '1.0',
                        capabilities: { tools: {} },
                        serverInfo: { name: 'drawing-board-mcp', version: MCP_TOOL_BRIDGE_VERSION }
                    };

                case 'tools/list':
                    return { tools: this.tools };

                case 'tools/call':
                    return await this.callTool(params.name, params.arguments);

                default:
                    throw new Error(`Method not found: ${method}`);
            }
        }

        // Call a specific tool
        async callTool(name, args) {
            const tool = this.tools.find(t => t.name === name);
            if (!tool) {
                throw new Error(`Tool not found: ${name}`);
            }

            // Execute the tool
            let result;
            switch (name) {
                case 'drawing_board_start':
                    result = this.toolStart(args.width, args.height, args.bg);
                    break;
                case 'drawing_board_draw_line':
                    result = this.toolDrawLine(args.x1, args.y1, args.x2, args.y2, args.color, args.lineWidth);
                    break;
                case 'drawing_board_draw_shape':
                    result = this.toolDrawShape(args.type, args.x, args.y, args.w, args.h, args.color, args.fill);
                    break;
                case 'drawing_board_add_text':
                    result = this.toolAddText(args.text, args.x, args.y, args.fontSize, args.color, args.fontFamily);
                    break;
                case 'drawing_board_fill_color':
                    result = this.toolFillColor(args.x, args.y, args.color);
                    break;
                case 'drawing_board_undo':
                    result = this.toolUndo();
                    break;
                case 'drawing_board_redo':
                    result = this.toolRedo();
                    break;
                case 'drawing_board_export':
                    result = this.toolExport(args.format, args.quality);
                    break;
                case 'drawing_board_save_project':
                    result = this.toolSaveProject(args.name);
                    break;
                case 'drawing_board_load_project':
                    result = this.toolLoadProject(args.id);
                    break;
                case 'drawing_board_play_bubble_game':
                    result = this.toolPlayBubbleGame(args.level);
                    break;
                default:
                    throw new Error(`Tool handler not implemented: ${name}`);
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result) }]
            };
        }

        // Tool implementations
        toolStart(width, height, bg) {
            try {
                const canvas = document.getElementById('drawingCanvas');
                const bgCanvas = document.getElementById('bgCanvas');
                if (!canvas || !bgCanvas) {
                    return { success: false, error: 'Canvas not found. DOM not ready.' };
                }

                if (width && height) {
                    canvas.width = width;
                    canvas.height = height;
                    bgCanvas.width = width;
                    bgCanvas.height = height;
                }

                if (bg) {
                    const ctx = bgCanvas.getContext('2d');
                    const bgColors = {
                        white: '#FFFFFF',
                        sky: '#A5D8FF',
                        grass: '#69DB7C',
                        beach: '#FFE066',
                        night: '#1A1A2E'
                    };
                    ctx.fillStyle = bgColors[bg] || '#FFFFFF';
                    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
                }

                return { success: true, width: canvas.width, height: canvas.height };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolDrawLine(x1, y1, x2, y2, color, lineWidth) {
            try {
                if (typeof drawLine === 'function') {
                    drawLine(x1, y1, x2, y2, color || '#000000', lineWidth || 5);
                    return { success: true };
                }
                return { success: false, error: 'drawLine function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolDrawShape(type, x, y, w, h, color, fill) {
            try {
                const ctx = drawingCanvas?.getContext('2d');
                if (!ctx) return { success: false, error: 'Canvas context not found' };

                const strokeColor = color || '#000000';
                ctx.strokeStyle = strokeColor;
                ctx.fillStyle = fill ? strokeColor : 'transparent';
                ctx.lineWidth = 2;

                switch (type) {
                    case 'rect':
                        if (fill) ctx.fillRect(x, y, w || 100, h || 100);
                        ctx.strokeRect(x, y, w || 100, h || 100);
                        break;
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(x, y, (w || 50), 0, Math.PI * 2);
                        if (fill) ctx.fill();
                        ctx.stroke();
                        break;
                    case 'triangle':
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + (w || 100), y);
                        ctx.lineTo(x + (w || 100) / 2, y - (h || 100));
                        ctx.closePath();
                        if (fill) ctx.fill();
                        ctx.stroke();
                        break;
                    case 'line':
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + (w || 100), y + (h || 100));
                        ctx.stroke();
                        break;
                    case 'star':
                        this.drawStar(ctx, x, y, 5, (w || 50), (h || 25));
                        break;
                    default:
                        return { success: false, error: `Unknown shape type: ${type}` };
                }
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.stroke();
        }

        toolAddText(text, x, y, fontSize, color, fontFamily) {
            try {
                const ctx = drawingCanvas?.getContext('2d');
                if (!ctx) return { success: false, error: 'Canvas context not found' };

                ctx.font = `${fontSize || 24}px ${fontFamily || 'Comic Sans MS'}`;
                ctx.fillStyle = color || '#000000';
                ctx.fillText(text, x, y);
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolFillColor(x, y, color) {
            try {
                if (typeof floodFill === 'function') {
                    const ctx = drawingCanvas?.getContext('2d');
                    if (!ctx) return { success: false, error: 'Canvas context not found' };
                    const result = floodFill(ctx, drawingCanvas, x, y, color);
                    return { success: result };
                }
                return { success: false, error: 'floodFill function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolUndo() {
            try {
                if (typeof undo === 'function') {
                    undo();
                    return { success: true };
                }
                return { success: false, error: 'undo function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolRedo() {
            try {
                if (typeof redo === 'function') {
                    redo();
                    return { success: true };
                }
                return { success: false, error: 'redo function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolExport(format, quality) {
            try {
                if (typeof getCanvasDataUrl === 'function') {
                    const dataUrl = getCanvasDataUrl();
                    return { success: true, dataUrl, format: format || 'png' };
                }
                return { success: false, error: 'getCanvasDataUrl function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolSaveProject(name) {
            try {
                if (typeof saveProject === 'function') {
                    const id = saveProject(name);
                    return { success: true, projectId: id };
                }
                return { success: false, error: 'saveProject function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolLoadProject(id) {
            try {
                if (typeof loadProject === 'function') {
                    const result = loadProject(id);
                    return { success: result !== false };
                }
                return { success: false, error: 'loadProject function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        toolPlayBubbleGame(level) {
            try {
                if (typeof toggleBubbleMode === 'function') {
                    toggleBubbleMode();
                    if (level && typeof setBubbleLevel === 'function') {
                        setBubbleLevel(level);
                    }
                    return { success: true };
                }
                return { success: false, error: 'toggleBubbleMode function not found' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
    }

    // Global MCP server instance
    let mcpServer = null;

    // Initialize MCP when DOM is ready
    function initMCPServer() {
        const urlParams = new URLSearchParams(window.location.search);
        const mcpEnabled = urlParams.get('mcp') === '1';

        if (mcpEnabled) {
            mcpServer = new MCPServer();
            mcpServer.enable();

            // Expose MCP tools to window for external access
            window.mcpTools = TOOLS;
            window.mcpCallTool = (name, args) => mcpServer.callTool(name, args);

            console.log(`[MCP] ${MCP_TOOL_BRIDGE_VERSION} initialized with ${TOOLS.length} tools`);
        }
    }

    // V71: Init
    const v71Init = setInterval(() => {
        if (document.getElementById('drawingCanvas')) {
            clearInterval(v71Init);
            initMCPServer();
            console.log(`[MCP] ${MCP_TOOL_BRIDGE_VERSION} Tool Bridge initialization complete`);
        }
    }, 300);

    // Expose for testing
    window._mcpServer = mcpServer;
    window._MCPToolBridge = { MCPServer, TOOLS, MCP_TOOL_BRIDGE_VERSION };

})();
import React, { useState } from 'react';
import { Activity, Cpu, Server, Zap, ChevronDown, AlertCircle, CheckCircle, Loader, X, Eye, Code, Play, Database, Settings, BarChart3, GitBranch } from 'lucide-react';

export default function RaptAIPlatform() {
  const [activeTab, setActiveTab] = useState('overview');
  const [deploymentMode, setDeploymentMode] = useState('auto');
  const [formData, setFormData] = useState({
    serviceName: '',
    modelName: '',
    namespace: 'default',
    modelParams: '7B',
    batchSize: '1',
    seqLen: '512',
    maxTokens: '2048',
    temperature: '0.7',
    topP: '0.9',
    gpuType: 'H100',
    gpuCount: '1',
    gpuMode: 'full',
    priority: 'standard',
    preferredDC: 'us-east-1',
    containerImage: 'vllm/vllm-openai:latest',
    port: '8000',
    replicas: '1'
  });

  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewYAML, setPreviewYAML] = useState('');
  const [showYAMLPreview, setShowYAMLPreview] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  // Mock data for overview
  const dataCenters = [
    { id: 1, name: 'US-East-1', location: 'Virginia, US', nodes: 12, gpus: 96, utilization: 74, status: 'online', gpuTypes: ['H100', 'A100', 'L40S'] },
    { id: 2, name: 'US-West-2', location: 'Oregon, US', nodes: 8, gpus: 64, utilization: 62, status: 'online', gpuTypes: ['H100', 'A100'] },
    { id: 3, name: 'EU-Central-1', location: 'Frankfurt, DE', nodes: 6, gpus: 48, utilization: 79, status: 'online', gpuTypes: ['A100', 'L40S', 'T4'] }
  ];

  const raptServices = [
    { id: 1, name: 'service-1', namespace: 'tenant-a', status: 'running', gpus: '8x H100', mode: 'full', priority: 'premium', dc: 'dc1', uptime: '3d 12h' },
    { id: 2, name: 'service-2', namespace: 'tenant-a', status: 'running', gpus: '2x L40S', mode: 'full', priority: 'standard', dc: 'dc1', uptime: '1d 6h' },
    { id: 3, name: 'service-spot-mig', namespace: 'tenant-a', status: 'running', gpus: '4x A100', mode: 'fractional', priority: 'spot', dc: 'dc2', uptime: '8h 23m' },
    { id: 4, name: 'training-job-1', namespace: 'tenant-b', status: 'running', gpus: '4x H100', mode: 'full', priority: 'premium', dc: 'dc2', uptime: '2d 4h' },
    { id: 5, name: 'inference-api', namespace: 'tenant-a', status: 'stopped', gpus: '2x A100', mode: 'full', priority: 'standard', dc: 'dc2', uptime: '-' }
  ];

  const apiEndpoints = [
    { method: 'GET', path: '/v1/datacenters', description: 'List all data centers' },
    { method: 'GET', path: '/v1/clusters?dc={dc}', description: 'List clusters in a data center' },
    { method: 'GET', path: '/v1/capacity?dc={dc}&gpuType={type}', description: 'Query GPU capacity' },
    { method: 'GET', path: '/v1/resources/gpus?dc={dc}', description: 'List GPU resources in DC' },
    { method: 'PUT', path: '/v1/services/{namespace}/{name}', description: 'Create or update a service' },
    { method: 'POST', path: '/v1/services/{namespace}/{name}:start', description: 'Start a service' },
    { method: 'POST', path: '/v1/services/{namespace}/{name}:stop', description: 'Stop a service' },
    { method: 'POST', path: '/v1/services/{namespace}/{name}:move', description: 'Move service to another DC' },
    { method: 'POST', path: '/v1/services/{namespace}/{name}:scale', description: 'Scale GPU allocation' },
    { method: 'GET', path: '/v1/services/{namespace}/{name}', description: 'Get service status' }
  ];

  const gpuTypes = ['H100', 'A100', 'L40S', 'A10', 'T4', 'V100'];
  const gpuModes = [
    { value: 'full', label: 'Full GPU', desc: 'Dedicated GPU access' },
    { value: 'fractional', label: 'Fractional (MIG)', desc: 'Shared GPU slice' }
  ];
  const priorities = [
    { value: 'premium', label: 'Premium', desc: 'Highest priority, non-preemptible' },
    { value: 'standard', label: 'Standard', desc: 'Normal priority' },
    { value: 'spot', label: 'Spot', desc: 'Low cost, can be preempted' }
  ];
  const datacenters = ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-south-1'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateKubernetesYAML = () => {
    const isAuto = deploymentMode === 'auto';
    const gpuResources = isAuto 
      ? calculateAutoGPUResources(formData)
      : {
          type: formData.gpuType,
          count: parseInt(formData.gpuCount),
          mode: formData.gpuMode
        };

    const yaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${formData.serviceName || 'my-service'}
  namespace: ${formData.namespace}
  labels:
    app: ${formData.serviceName || 'my-service'}
    managed-by: rapt.ai
    deployment-mode: ${deploymentMode}
    model: ${formData.modelName || 'unspecified'}
spec:
  replicas: ${formData.replicas}
  selector:
    matchLabels:
      app: ${formData.serviceName || 'my-service'}
  template:
    metadata:
      labels:
        app: ${formData.serviceName || 'my-service'}
        gpu-type: ${gpuResources.type}
        priority: ${isAuto ? 'standard' : formData.priority}
      annotations:
        rapt.ai/batch-size: "${formData.batchSize}"
        rapt.ai/seq-len: "${formData.seqLen}"
        rapt.ai/max-tokens: "${formData.maxTokens}"
        rapt.ai/gpu-mode: "${gpuResources.mode}"
        ${!isAuto ? `rapt.ai/preferred-dc: "${formData.preferredDC}"` : ''}
    spec:
      ${!isAuto && formData.priority === 'premium' ? 'priorityClassName: rapt-premium' : ''}
      ${!isAuto && formData.priority === 'spot' ? 'priorityClassName: rapt-spot' : ''}
      nodeSelector:
        rapt.ai/gpu-type: ${gpuResources.type}
        ${!isAuto ? `rapt.ai/datacenter: ${formData.preferredDC}` : ''}
      containers:
      - name: ${formData.serviceName || 'my-service'}
        image: ${formData.containerImage}
        ports:
        - containerPort: ${formData.port}
          name: http
          protocol: TCP
        env:
        - name: MODEL_NAME
          value: "${formData.modelName}"
        - name: MAX_MODEL_LEN
          value: "${formData.seqLen}"
        - name: GPU_MEMORY_UTILIZATION
          value: "0.9"
        - name: TENSOR_PARALLEL_SIZE
          value: "${gpuResources.count}"
        resources:
          requests:
            nvidia.com/gpu: ${gpuResources.count}
            memory: ${calculateMemory(gpuResources)}Gi
            cpu: ${calculateCPU(gpuResources)}
          limits:
            nvidia.com/gpu: ${gpuResources.count}
            memory: ${calculateMemory(gpuResources)}Gi
        livenessProbe:
          httpGet:
            path: /health
            port: ${formData.port}
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: ${formData.port}
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${formData.serviceName || 'my-service'}
  namespace: ${formData.namespace}
  labels:
    app: ${formData.serviceName || 'my-service'}
spec:
  type: ClusterIP
  ports:
  - port: ${formData.port}
    targetPort: ${formData.port}
    protocol: TCP
    name: http
  selector:
    app: ${formData.serviceName || 'my-service'}`;

    return yaml;
  };

  const calculateAutoGPUResources = (data) => {
    // Use modelParams field if available, otherwise estimate from modelName
    const modelSizeGB = data.modelParams 
      ? estimateModelSizeFromParams(data.modelParams)
      : estimateModelSize(data.modelName);
    
    const seqLen = parseInt(data.seqLen) || 512;
    const batchSize = parseInt(data.batchSize) || 1;
    const kvCacheGB = (batchSize * seqLen * 2 * 5120 * 40) / (1024 ** 3);
    const totalMemoryNeeded = modelSizeGB + kvCacheGB + 4;

    let gpuType = 'T4';
    let gpuCount = 1;
    
    if (totalMemoryNeeded > 80) {
      gpuType = 'H100';
      gpuCount = Math.ceil(totalMemoryNeeded / 80);
    } else if (totalMemoryNeeded > 40) {
      gpuType = 'A100';
      gpuCount = Math.ceil(totalMemoryNeeded / 40);
    } else if (totalMemoryNeeded > 24) {
      gpuType = 'L40S';
      gpuCount = Math.ceil(totalMemoryNeeded / 24);
    } else if (totalMemoryNeeded > 16) {
      gpuType = 'T4';
      gpuCount = Math.ceil(totalMemoryNeeded / 16);
    }

    return { type: gpuType, count: gpuCount, mode: 'full' };
  };

  const estimateModelSizeFromParams = (params) => {
    const sizeMap = {
      '1B': 2,
      '3B': 6,
      '7B': 14,
      '13B': 26,
      '33B': 66,
      '34B': 68,
      '65B': 130,
      '70B': 140,
      '175B': 350,
      '405B': 810
    };
    return sizeMap[params] || 14;
  };

  const estimateModelSize = (modelName) => {
    const name = modelName.toLowerCase();
    if (name.includes('405b')) return 810;
    if (name.includes('175b')) return 350;
    if (name.includes('70b') || name.includes('65b')) return 140;
    if (name.includes('34b') || name.includes('33b')) return 68;
    if (name.includes('13b')) return 26;
    if (name.includes('7b')) return 14;
    if (name.includes('3b')) return 6;
    if (name.includes('1b')) return 2;
    return 14;
  };

  const calculateMemory = (gpuResources) => {
    const memoryMap = { 'H100': 80, 'A100': 40, 'L40S': 48, 'A10': 24, 'T4': 16, 'V100': 32 };
    const gpuMemory = memoryMap[gpuResources.type] || 16;
    return Math.ceil(gpuMemory * gpuResources.count * 1.2);
  };

  const calculateCPU = (gpuResources) => {
    return Math.min(gpuResources.count * 8, 64);
  };

  const handlePreviewYAML = () => {
    const yaml = generateKubernetesYAML();
    setPreviewYAML(yaml);
    setShowYAMLPreview(true);
  };

  const handleDeploy = async () => {
    // Clear any previous status
    setDeploymentStatus(null);
    setIsDeploying(true);

    // Simulate API call with 2 second delay
    setTimeout(() => {
      // Generate random pod IP for demo
      const randomIP = `10.42.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      setDeploymentStatus({
        success: true,
        message: 'Deployment successful!',
        podIP: randomIP,
        port: formData.port,
        serviceName: formData.serviceName,
        namespace: formData.namespace,
        endpoint: `http://${formData.serviceName}.${formData.namespace}.svc.cluster.local:${formData.port}`,
        externalAccess: `${formData.serviceName}.${formData.namespace}.svc.cluster.local:${formData.port}`,
        resources: deploymentMode === 'auto' ? calculateAutoGPUResources(formData) : {
          type: formData.gpuType,
          count: parseInt(formData.gpuCount),
          mode: formData.gpuMode
        }
      });
      setIsDeploying(false);
    }, 2000);
  };

  const closeYAMLPreview = () => {
    setShowYAMLPreview(false);
  };

  const copyYAMLToClipboard = () => {
    navigator.clipboard.writeText(previewYAML);
  };

  const handleAPIClick = (endpoint) => {
    setSelectedAPI(endpoint);
    
    // Generate mock response based on endpoint
    let mockResponse = {};
    
    if (endpoint.path === '/v1/datacenters') {
      mockResponse = {
        datacenters: [
          { id: 'dc1', name: 'US-East-1', location: 'Virginia, US', status: 'online' },
          { id: 'dc2', name: 'US-West-2', location: 'Oregon, US', status: 'online' },
          { id: 'dc3', name: 'EU-Central-1', location: 'Frankfurt, DE', status: 'online' }
        ]
      };
    } else if (endpoint.path.includes('/v1/clusters')) {
      mockResponse = {
        clusters: [
          { id: 'cluster-1', name: 'production', datacenter: 'dc1', nodes: 12 },
          { id: 'cluster-2', name: 'staging', datacenter: 'dc1', nodes: 4 }
        ]
      };
    } else if (endpoint.path.includes('/v1/capacity')) {
      mockResponse = {
        datacenter: 'dc1',
        gpuType: 'H100',
        total: 96,
        allocated: 71,
        available: 25,
        utilizationPercent: 74
      };
    } else if (endpoint.path.includes('/v1/resources/gpus')) {
      mockResponse = {
        gpus: [
          { nodeId: 'gpu-node-01', gpuType: 'H100', count: 8, allocated: 6, available: 2 },
          { nodeId: 'gpu-node-02', gpuType: 'H100', count: 8, allocated: 8, available: 0 },
          { nodeId: 'gpu-node-03', gpuType: 'A100', count: 8, allocated: 4, available: 4 }
        ]
      };
    } else if (endpoint.method === 'PUT' && endpoint.path.includes('/v1/services')) {
      mockResponse = {
        status: 'success',
        message: 'Service created successfully',
        service: {
          name: 'my-service',
          namespace: 'tenant-a',
          state: 'Running',
          podIP: '10.42.1.23',
          port: 8080,
          endpoint: 'my-service.tenant-a.svc.cluster.local:8080'
        }
      };
    } else if (endpoint.method === 'POST' && endpoint.path.includes(':start')) {
      mockResponse = {
        status: 'success',
        message: 'Service started successfully',
        service: { name: 'my-service', state: 'Running' }
      };
    } else if (endpoint.method === 'POST' && endpoint.path.includes(':stop')) {
      mockResponse = {
        status: 'success',
        message: 'Service stopped successfully',
        service: { name: 'my-service', state: 'Stopped' }
      };
    } else if (endpoint.method === 'GET' && endpoint.path.match(/\/v1\/services\/[^:]+$/)) {
      mockResponse = {
        service: {
          name: 'my-service',
          namespace: 'tenant-a',
          state: 'Running',
          podIP: '10.42.1.23',
          port: 8080,
          gpu: { type: 'H100', count: 2, mode: 'full' },
          priority: 'premium',
          uptime: '3d 12h 45m',
          endpoint: 'my-service.tenant-a.svc.cluster.local:8080'
        }
      };
    } else {
      mockResponse = {
        status: 'success',
        message: 'Operation completed successfully'
      };
    }
    
    setApiResponse(mockResponse);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Rapt.ai</h1>
              <p className="text-xs text-zinc-400">GPU Orchestration Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full">
              <Activity className="w-3 h-3" />
              <span>Controller Healthy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950/50">
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'services'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Services
              </div>
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'deploy'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Deploy
              </div>
              {activeTab === 'deploy' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'api'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                API
              </div>
              {activeTab === 'api' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-zinc-500">2 online</span>
                </div>
                <div className="text-4xl font-bold mb-1">3</div>
                <div className="text-sm text-zinc-400">Data Centers</div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs text-zinc-500">208 total GPUs</span>
                </div>
                <div className="text-4xl font-bold mb-1">26</div>
                <div className="text-sm text-zinc-400">GPU Nodes</div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-zinc-500">57 available</span>
                </div>
                <div className="text-4xl font-bold mb-1">151</div>
                <div className="text-sm text-zinc-400">GPUs Allocated</div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Server className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-zinc-500">4 running</span>
                </div>
                <div className="text-4xl font-bold mb-1">5</div>
                <div className="text-sm text-zinc-400">Services</div>
              </div>
            </div>

            {/* Data Centers */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-lg font-semibold">Data Centers</h2>
              </div>
              <div className="divide-y divide-zinc-800">
                {dataCenters.map(dc => (
                  <div key={dc.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{dc.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            dc.status === 'online' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {dc.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{dc.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold mb-1">{dc.utilization}%</div>
                        <div className="text-xs text-zinc-500">GPU Utilization</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Nodes</div>
                        <div className="font-semibold">{dc.nodes}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Total GPUs</div>
                        <div className="font-semibold">{dc.gpus}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">GPU Types</div>
                        <div className="flex gap-1">
                          {dc.gpuTypes.map(type => (
                            <span key={type} className="px-2 py-0.5 bg-zinc-800 rounded text-xs">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${dc.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-lg font-semibold">Event Log</h2>
              </div>
              <div className="divide-y divide-zinc-800">
                <div className="p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-zinc-500 w-20">14:01:55</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">info</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">[system]</span>
                    <span className="flex-1 text-sm">Rapt.ai orchestration platform initialized.</span>
                  </div>
                </div>
                <div className="p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-zinc-500 w-20">14:01:55</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">success</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">[controller]</span>
                    <span className="flex-1 text-sm">All reconciler loops healthy.</span>
                  </div>
                </div>
                <div className="p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-zinc-500 w-20">14:01:55</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">info</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">[discovery]</span>
                    <span className="flex-1 text-sm">Discovered 3 data centers, 11 GPU nodes.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">RaptServices</h2>
              <button
                onClick={() => setActiveTab('deploy')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Create Service
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-950 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Service Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Namespace</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">GPU Config</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">DC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {raptServices.map(service => (
                      <tr key={service.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              service.status === 'running' ? 'bg-emerald-400' : 'bg-zinc-600'
                            }`} />
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {service.namespace}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {service.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {service.gpus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {service.mode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${
                            service.priority === 'premium'
                              ? 'bg-purple-500/10 text-purple-400'
                              : service.priority === 'spot'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {service.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {service.dc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {service.uptime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Deploy Kubernetes Endpoint</h2>
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <button
                  onClick={() => setDeploymentMode('auto')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    deploymentMode === 'auto'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Zap className={`w-5 h-5 mt-0.5 ${deploymentMode === 'auto' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">AUTO Mode</h3>
                      <p className="text-sm text-zinc-400">
                        Rapt.ai automatically selects optimal GPU resources based on your model requirements
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setDeploymentMode('manual')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    deploymentMode === 'manual'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Cpu className={`w-5 h-5 mt-0.5 ${deploymentMode === 'manual' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">MANUAL Mode</h3>
                      <p className="text-sm text-zinc-400">
                        Full control over GPU type, count, priority, and data center placement
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Configuration */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    Basic Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        name="serviceName"
                        value={formData.serviceName}
                        onChange={handleInputChange}
                        placeholder="my-llm-service"
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">
                        Namespace
                      </label>
                      <input
                        type="text"
                        name="namespace"
                        value={formData.namespace}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2 text-zinc-300">
                        Model Name *
                      </label>
                      <input
                        type="text"
                        name="modelName"
                        value={formData.modelName}
                        onChange={handleInputChange}
                        placeholder="meta-llama/Llama-2-7b-chat-hf"
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                      <p className="mt-1.5 text-xs text-zinc-500">
                        HuggingFace model identifier or path
                      </p>
                    </div>
                  </div>
                </div>

                {/* AUTO Mode: Model Parameters */}
                {deploymentMode === 'auto' && (
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-400" />
                      Model Parameters
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Parameters
                        </label>
                        <select
                          name="modelParams"
                          value={formData.modelParams || '7B'}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none text-white"
                        >
                          <option value="1B">1B</option>
                          <option value="3B">3B</option>
                          <option value="7B">7B</option>
                          <option value="13B">13B</option>
                          <option value="33B">33B</option>
                          <option value="34B">34B</option>
                          <option value="65B">65B</option>
                          <option value="70B">70B</option>
                          <option value="175B">175B</option>
                          <option value="405B">405B</option>
                        </select>
                        <p className="mt-1.5 text-xs text-zinc-500">
                          Model size for estimation
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Batch Size
                        </label>
                        <input
                          type="number"
                          name="batchSize"
                          value={formData.batchSize}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Sequence Length
                        </label>
                        <input
                          type="number"
                          name="seqLen"
                          value={formData.seqLen}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          name="maxTokens"
                          value={formData.maxTokens}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Temperature
                        </label>
                        <input
                          type="number"
                          name="temperature"
                          value={formData.temperature}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="2"
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Top P
                        </label>
                        <input
                          type="number"
                          name="topP"
                          value={formData.topP}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="1"
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MANUAL Mode: GPU Configuration */}
                {deploymentMode === 'manual' && (
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      GPU Configuration
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          GPU Type *
                        </label>
                        <select
                          name="gpuType"
                          value={formData.gpuType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none text-white"
                        >
                          {gpuTypes.map(gpu => (
                            <option key={gpu} value={gpu}>{gpu}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          GPU Count *
                        </label>
                        <input
                          type="number"
                          name="gpuCount"
                          value={formData.gpuCount}
                          onChange={handleInputChange}
                          min="1"
                          max="8"
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          GPU Mode *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {gpuModes.map(mode => (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, gpuMode: mode.value }))}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                formData.gpuMode === mode.value
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{mode.label}</div>
                              <div className="text-xs text-zinc-500">{mode.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Priority *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {priorities.map(priority => (
                            <button
                              key={priority.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                formData.priority === priority.value
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{priority.label}</div>
                              <div className="text-xs text-zinc-500">{priority.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Preferred Data Center *
                        </label>
                        <select
                          name="preferredDC"
                          value={formData.preferredDC}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none text-white"
                        >
                          {datacenters.map(dc => (
                            <option key={dc} value={dc}>{dc}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Batch Size
                        </label>
                        <input
                          type="number"
                          name="batchSize"
                          value={formData.batchSize}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Sequence Length
                        </label>
                        <input
                          type="number"
                          name="seqLen"
                          value={formData.seqLen}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          name="maxTokens"
                          value={formData.maxTokens}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Temperature
                        </label>
                        <input
                          type="number"
                          name="temperature"
                          value={formData.temperature}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="2"
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Settings */}
                <details className="bg-zinc-900 rounded-xl border border-zinc-800">
                  <summary className="p-6 cursor-pointer font-semibold hover:bg-zinc-800/50 rounded-xl transition-colors list-none flex items-center justify-between">
                    <span>Advanced Settings</span>
                    <ChevronDown className="w-5 h-5" />
                  </summary>
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Container Image
                        </label>
                        <input
                          type="text"
                          name="containerImage"
                          value={formData.containerImage}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Port
                        </label>
                        <input
                          type="number"
                          name="port"
                          value={formData.port}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Replicas
                        </label>
                        <input
                          type="number"
                          name="replicas"
                          value={formData.replicas}
                          onChange={handleInputChange}
                          min="1"
                          max="10"
                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        />
                      </div>
                    </div>
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePreviewYAML}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview YAML
                  </button>
                  
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying || !formData.serviceName}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeploying ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Deploy Service
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Panel */}
              <div className="space-y-6">
                {/* Resource Summary */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4">Resource Summary</h3>
                  
                  {deploymentMode === 'auto' && (formData.modelName || formData.modelParams) && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="text-blue-400 font-medium mb-1">AUTO Mode Active</div>
                          <div className="text-zinc-400 text-xs">
                            Rapt.ai will automatically select optimal GPU resources
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                      <span className="text-sm text-zinc-400">Mode</span>
                      <span className="font-medium uppercase text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                        {deploymentMode}
                      </span>
                    </div>

                    {deploymentMode === 'auto' && (formData.modelName || formData.modelParams) ? (
                      (() => {
                        const resources = calculateAutoGPUResources(formData);
                        return (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                              <span className="text-sm text-zinc-400">Model Size</span>
                              <span className="font-medium">{formData.modelParams || 'Auto-detected'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                              <span className="text-sm text-zinc-400">Estimated GPU</span>
                              <span className="font-medium">{resources.count}x {resources.type}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                              <span className="text-sm text-zinc-400">GPU Mode</span>
                              <span className="font-medium capitalize">{resources.mode}</span>
                            </div>
                          </>
                        );
                      })()
                    ) : deploymentMode === 'manual' ? (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <span className="text-sm text-zinc-400">GPU Configuration</span>
                          <span className="font-medium">{formData.gpuCount}x {formData.gpuType}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <span className="text-sm text-zinc-400">GPU Mode</span>
                          <span className="font-medium capitalize">{formData.gpuMode}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <span className="text-sm text-zinc-400">Priority</span>
                          <span className="font-medium capitalize">{formData.priority}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <span className="text-sm text-zinc-400">Data Center</span>
                          <span className="font-medium">{formData.preferredDC}</span>
                        </div>
                      </>
                    ) : null}

                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                      <span className="text-sm text-zinc-400">Namespace</span>
                      <span className="font-medium">{formData.namespace}</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-zinc-400">Replicas</span>
                      <span className="font-medium">{formData.replicas}</span>
                    </div>
                  </div>
                </div>

                {/* Deployment Status */}
                {deploymentStatus && (
                  <div className={`rounded-xl border p-6 ${
                    deploymentStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      {deploymentStatus.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold mb-3 ${
                          deploymentStatus.success ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {deploymentStatus.message}
                        </h4>
                        
                        {deploymentStatus.success && (
                          <div className="space-y-3 text-sm">
                            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                              <div className="text-zinc-400 mb-2 font-medium">Access Information:</div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-zinc-500 text-xs">Pod IP:</span>
                                  <code className="block mt-1 px-2 py-1 bg-zinc-900 rounded text-emerald-400 text-xs">
                                    {deploymentStatus.podIP}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-zinc-500 text-xs">Pod Port:</span>
                                  <code className="block mt-1 px-2 py-1 bg-zinc-900 rounded text-emerald-400 text-xs">
                                    {deploymentStatus.port}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-zinc-500 text-xs">Direct Access:</span>
                                  <code className="block mt-1 px-2 py-1 bg-zinc-900 rounded text-emerald-400 text-xs break-all">
                                    {deploymentStatus.podIP}:{deploymentStatus.port}
                                  </code>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-zinc-400 mb-1 text-xs">Service Endpoint:</div>
                              <code className="block px-2 py-1 bg-zinc-950 rounded text-xs break-all">
                                {deploymentStatus.externalAccess}
                              </code>
                            </div>
                            
                            <div>
                              <div className="text-zinc-400 mb-1 text-xs">Allocated Resources:</div>
                              <div className="text-white font-medium">
                                {deploymentStatus.resources.count}x {deploymentStatus.resources.type} ({deploymentStatus.resources.mode})
                              </div>
                            </div>

                            <div className="pt-3 border-t border-zinc-800">
                              <div className="text-zinc-400 mb-2 text-xs">Usage Examples:</div>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-zinc-500">Terminal Access:</span>
                                  <code className="block mt-1 px-2 py-1 bg-zinc-900 rounded text-xs break-all">
                                    kubectl exec -it {formData.serviceName}-xxx-xxx -- /bin/bash
                                  </code>
                                </div>
                                <div>
                                  <span className="text-zinc-500">API Test (from cluster):</span>
                                  <code className="block mt-1 px-2 py-1 bg-zinc-900 rounded text-xs break-all">
                                    curl http://{deploymentStatus.podIP}:{deploymentStatus.port}/health
                                  </code>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h4 className="font-semibold mb-3 text-sm">How it works</h4>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>Configure your service and model parameters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>Choose AUTO for intelligent resource selection or MANUAL for full control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>Rapt.ai orchestrates deployment across your GPU cluster</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>Service endpoint is automatically created and exposed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">REST API Explorer</h2>
              <p className="text-zinc-400">
                Rapt.ai provides a comprehensive REST API for programmatic access to all platform features. Click any endpoint to see example response.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - API Endpoints */}
              <div className="space-y-6">
                {/* Discovery Endpoints */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold">Discovery Endpoints</h3>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {apiEndpoints.slice(0, 4).map((endpoint, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAPIClick(endpoint)}
                        className={`w-full p-6 hover:bg-zinc-800/50 transition-colors text-left ${
                          selectedAPI?.path === endpoint.path ? 'bg-zinc-800/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                            endpoint.method === 'GET' 
                              ? 'bg-blue-500/10 text-blue-400'
                              : endpoint.method === 'POST'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm font-mono text-white block mb-2">
                              {endpoint.path}
                            </code>
                            <p className="text-sm text-zinc-400">{endpoint.description}</p>
                          </div>
                          {selectedAPI?.path === endpoint.path && (
                            <ChevronDown className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Lifecycle Endpoints */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold">Service Lifecycle</h3>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {apiEndpoints.slice(4).map((endpoint, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAPIClick(endpoint)}
                        className={`w-full p-6 hover:bg-zinc-800/50 transition-colors text-left ${
                          selectedAPI?.path === endpoint.path ? 'bg-zinc-800/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                            endpoint.method === 'GET' 
                              ? 'bg-blue-500/10 text-blue-400'
                              : endpoint.method === 'POST'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm font-mono text-white block mb-2">
                              {endpoint.path}
                            </code>
                            <p className="text-sm text-zinc-400">{endpoint.description}</p>
                          </div>
                          {selectedAPI?.path === endpoint.path && (
                            <ChevronDown className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Response Display */}
              <div className="space-y-6">
                {selectedAPI ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-6">
                    <div className="p-6 border-b border-zinc-800">
                      <h3 className="text-lg font-semibold mb-2">API Response</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          selectedAPI.method === 'GET' 
                            ? 'bg-blue-500/10 text-blue-400'
                            : selectedAPI.method === 'POST'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {selectedAPI.method}
                        </span>
                        <code className="text-xs text-zinc-400">{selectedAPI.path}</code>
                      </div>
                      <p className="text-sm text-zinc-400">{selectedAPI.description}</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="text-sm font-medium text-zinc-400 mb-2">Example Response:</div>
                        <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 max-h-96 overflow-auto">
                          <pre className="text-xs text-emerald-400">
                            <code>{JSON.stringify(apiResponse, null, 2)}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-800">
                        <div className="text-sm font-medium text-zinc-400 mb-2">Example cURL Request:</div>
                        <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800">
                          <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-all">
                            <code>{`curl -X ${selectedAPI.method} https://api.rapt.ai${selectedAPI.path} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center sticky top-6">
                    <Code className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select an API Endpoint</h3>
                    <p className="text-sm text-zinc-400">
                      Click any endpoint on the left to see example requests and responses
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* YAML Preview Modal */}
      {showYAMLPreview && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={closeYAMLPreview}
        >
          <div 
            className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-4xl w-full flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold">Kubernetes YAML Preview</h3>
              <button
                onClick={closeYAMLPreview}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <pre className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-lg">
                <code>{previewYAML}</code>
              </pre>
            </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={copyYAMLToClipboard}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={closeYAMLPreview}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

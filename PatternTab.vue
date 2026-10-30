<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
      <div>
        <h3 class="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <font-awesome-icon :icon="['fas', 'shapes']" class="text-indigo-500" />
          <span>Pattern Fill</span>
        </h3>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Apply repeating patterns to a selected cloth panel or to the whole garment.
        </p>
      </div>
    </div>

    <div class="space-y-2 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
      <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span class="flex items-center gap-1.5">
          <font-awesome-icon :icon="['fas', 'bullseye']" class="text-indigo-500 text-xs" />
          <span>Target Area</span>
        </span>
        <span class="text-[10px] text-indigo-500 font-mono font-normal">{{ activePartName }}</span>
      </label>

      <div class="flex flex-wrap gap-2 pt-1">
        <button
          @click="selectedPartId = 'ALL'"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
            selectedPartId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
          ]"
        >
          <font-awesome-icon :icon="['fas', 'layer-group']" class="text-[11px]" />
          <span>All Panels</span>
        </button>

        <button
          v-for="part in jerseyParts"
          :key="part.id"
          @click="selectedPartId = part.id"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
            selectedPartId === part.id
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
          ]"
        >
          <span
            class="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block shrink-0"
            :style="{ backgroundColor: part.color || '#ffffff' }"
          ></span>
          <span>{{ part.name }}</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="activeCategory = cat"
        :class="[
          'px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-150 shrink-0 cursor-pointer',
          activeCategory === cat
            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        ]"
      >
        {{ cat }}
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <label
        class="relative flex flex-col items-center justify-center p-3 h-24 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 cursor-pointer transition-all duration-200 group text-center"
      >
        <input
          type="file"
          accept="image/*,.svg"
          class="hidden"
          @change="handleFileUpload"
        />
        <font-awesome-icon
          :icon="['fas', 'cloud-arrow-up']"
          class="text-indigo-500 text-lg mb-1 group-hover:scale-110 transition-transform duration-200"
        />
        <span class="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Upload</span>
        <span class="text-[9px] text-slate-400 dark:text-slate-500">PNG / SVG</span>
      </label>

      <div
        v-for="pattern in filteredPatterns"
        :key="pattern.id"
        @click="selectPattern(pattern)"
        :class="[
          'relative p-2 h-24 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between overflow-hidden group',
          activePatternId === pattern.id
            ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-400'
        ]"
      >
        <div
          class="w-full flex-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative"
          :style="{
            backgroundColor: activeBgColor,
            backgroundImage: `url(${pattern.url})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '24px 24px'
          }"
        ></div>
        <p class="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 truncate text-center">
          {{ pattern.name }}
        </p>
      </div>
    </div>

    <div
      v-if="activePatternUrl"
      class="space-y-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <font-awesome-icon :icon="['fas', 'sliders']" class="text-indigo-500 text-xs" />
          <span>Pattern Controls</span>
        </span>
        <button
          @click="resetControls"
          class="text-[10px] text-slate-400 hover:text-indigo-500 transition-colors"
        >
          Reset
        </button>
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Scale</span>
          <span class="font-mono text-indigo-500 font-semibold">{{ patternScale.toFixed(2) }}x</span>
        </div>
        <input
          v-model.number="patternScale"
          type="range"
          min="0.1"
          max="50.0"
          step="0.1"
          @input="emitCurrentPattern"
          @change="emitCurrentPatternImmediate"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Rotation</span>
          <span class="font-mono text-indigo-500 font-semibold">{{ patternAngle }}°</span>
        </div>
        <input
          v-model.number="patternAngle"
          type="range"
          min="0"
          max="360"
          step="5"
          @input="emitCurrentPattern"
          @change="emitCurrentPatternImmediate"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Opacity</span>
          <span class="font-mono text-indigo-500 font-semibold">{{ Math.round(patternOpacity * 100) }}%</span>
        </div>
        <input
          v-model.number="patternOpacity"
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          @input="emitCurrentPattern"
          @change="emitCurrentPatternImmediate"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Offset X</span>
          <span class="font-mono text-indigo-500 font-semibold">{{ patternOffsetX }}px</span>
        </div>
        <input
          v-model.number="patternOffsetX"
          type="range"
          min="-500"
          max="500"
          step="1"
          @input="emitCurrentPattern"
          @change="emitCurrentPatternImmediate"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Offset Y</span>
          <span class="font-mono text-indigo-500 font-semibold">{{ patternOffsetY }}px</span>
        </div>
        <input
          v-model.number="patternOffsetY"
          type="range"
          min="-500"
          max="500"
          step="1"
          @input="emitCurrentPattern"
          @change="emitCurrentPatternImmediate"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Pattern Tint</span>
          <div class="flex items-center gap-2">
            <button
              @click="patternColor = null; emitCurrentPatternImmediate()"
              class="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Original
            </button>
            <input
              v-model="customPatternColor"
              type="color"
              @input="onCustomPatternColor"
              class="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
            />
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            @click="clearPatternColor"
            :class="[
              'w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-transform cursor-pointer hover:scale-110 relative overflow-hidden bg-white dark:bg-slate-900',
              patternColor == null ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
            ]"
            type="button"
            title="Original"
          >
            <span class="absolute inset-0 bg-gradient-to-br from-white via-slate-100 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950"></span>
            <span class="absolute left-1/2 top-1/2 w-8 h-[2px] bg-rose-500 -translate-x-1/2 -translate-y-1/2 rotate-45"></span>
          </button>
          <button
            v-for="color in quickColors"
            :key="color"
            @click="setPatternColor(color)"
            :class="[
              'w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-transform cursor-pointer hover:scale-110',
              patternColor === color ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
            ]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-600 dark:text-slate-400 font-medium">Background</span>
          <input
            v-model="customBgColor"
            type="color"
            @input="onCustomBgColor"
            class="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="color in colors"
            :key="color"
            @click="setBgColor(color)"
            :class="[
              'w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-transform cursor-pointer hover:scale-110',
              activeBgColor === color ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
            ]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button
          @click="removeCurrentPattern"
          class="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <font-awesome-icon :icon="['fas', 'trash-can']" />
          <span>Remove Pattern</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { throttle } from 'lodash';
import { PatternPresets } from '../../configs/patterns';

const props = defineProps({
  jerseyParts: {
    type: Array,
    default: () => []
  },
  patterns: {
    type: Array,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['setPattern', 'removePattern']);

const selectedPartId = ref('ALL');
const categories = ['All', 'Lines', 'Texture', 'Shapes', 'Classic', 'Camo', 'Tech', 'Artwork'];
const activeCategory = ref('All');
const activePatternId = ref(null);
const activePatternUrl = ref('');
const activePatternName = ref('');
const activePatternCategory = ref('Artwork');
const activePatternSource = ref('preset');
const patternScale = ref(1.0);
const patternAngle = ref(0);
const patternOpacity = ref(1.0);
const patternOffsetX = ref(0);
const patternOffsetY = ref(0);
const patternColor = ref(null);
const activeBgColor = ref('#ffffff');
const customPatternColor = ref('#000000');
const customBgColor = ref('#ffffff');
const quickColors = ['#000000', '#ffffff', '#DA1A32', '#0047AB', '#008000', '#FFD700', '#FF69B4', '#800080'];

const getPatternKey = (pattern) => {
  if (!pattern) return null;
  return pattern.patternId || pattern.id || pattern.url || null;
};

const clearActivePatternState = () => {
  activePatternId.value = null;
  activePatternUrl.value = '';
  activePatternName.value = '';
  activePatternCategory.value = 'Artwork';
  activePatternSource.value = 'preset';
  patternScale.value = 1.0;
  patternAngle.value = 0;
  patternOpacity.value = 1.0;
  patternOffsetX.value = 0;
  patternOffsetY.value = 0;
  patternColor.value = null;
  customPatternColor.value = '#000000';
};

const mergedPatterns = computed(() => {
  const base = [...PatternPresets];
  (props.patterns || []).forEach((pattern) => {
    if (!pattern?.url) return;
    const id = pattern.patternId || pattern.id || `imported_${pattern.targetPartIds?.[0] || 'all'}`;
    if (base.some((item) => item.id === id)) return;
    base.unshift({
      id,
      name: pattern.name || 'Imported Pattern',
      category: pattern.category || 'Artwork',
      url: pattern.url
    });
  });
  return base;
});

const activePartName = computed(() => {
  if (selectedPartId.value === 'ALL') return 'All Panels';
  const part = props.jerseyParts.find((p) => p.id === selectedPartId.value);
  return part ? part.name : selectedPartId.value;
});

const filteredPatterns = computed(() => {
  if (activeCategory.value === 'All') {
    return mergedPatterns.value;
  }
  return mergedPatterns.value.filter((p) => p.category === activeCategory.value);
});

watch(
  selectedPartId,
  (newPartId) => {
    if (newPartId === 'ALL') {
      return;
    }
    const part = props.jerseyParts.find((p) => p.id === newPartId);
    if (part?.color) {
      activeBgColor.value = part.color;
      customBgColor.value = part.color;
    }
  },
  { immediate: true }
);

watch(
  [() => props.patterns, selectedPartId],
  ([patterns, currentPartId]) => {
    if (!Array.isArray(patterns) || !patterns.length) {
      clearActivePatternState();
      return;
    }

    const currentPattern = patterns.find((pattern) =>
      currentPartId === 'ALL'
        ? pattern.targetMode === 'all' || !pattern.targetPartIds?.length
        : pattern.targetMode === 'parts' && pattern.targetPartIds?.includes(currentPartId)
    );

    if (!currentPattern) {
      clearActivePatternState();
      return;
    }

    const targetPartId =
      currentPattern.targetMode === 'parts' && currentPattern.targetPartIds?.length
        ? currentPattern.targetPartIds[0]
        : 'ALL';
    const nextPatternKey = getPatternKey(currentPattern);

    if (activePatternId.value === nextPatternKey) {
      patternScale.value = currentPattern.scale ?? 1.0;
      patternAngle.value = currentPattern.angle ?? 0;
      patternOpacity.value = currentPattern.opacity ?? 1.0;
      patternOffsetX.value = currentPattern.offsetX ?? 0;
      patternOffsetY.value = currentPattern.offsetY ?? 0;
      patternColor.value = currentPattern.patternColor ?? null;
      customPatternColor.value = currentPattern.patternColor || '#000000';
      activeBgColor.value = currentPattern.bgColor || activeBgColor.value;
      customBgColor.value = currentPattern.bgColor || customBgColor.value;
      if (currentPattern.category) {
        activeCategory.value = currentPattern.category;
      }
      return;
    }

    activePatternId.value = nextPatternKey || `imported_${targetPartId}`;
    activePatternUrl.value = currentPattern.url || '';
    activePatternName.value = currentPattern.name || 'Imported Pattern';
    activePatternCategory.value = currentPattern.category || 'Artwork';
    activePatternSource.value = currentPattern.source || 'preset';
    patternScale.value = currentPattern.scale ?? 1.0;
    patternAngle.value = currentPattern.angle ?? 0;
    patternOpacity.value = currentPattern.opacity ?? 1.0;
    patternOffsetX.value = currentPattern.offsetX ?? 0;
    patternOffsetY.value = currentPattern.offsetY ?? 0;
    patternColor.value = currentPattern.patternColor ?? null;
    customPatternColor.value = currentPattern.patternColor || '#000000';
    activeBgColor.value = currentPattern.bgColor || activeBgColor.value;
    customBgColor.value = currentPattern.bgColor || customBgColor.value;
    if (currentPattern.category) {
      activeCategory.value = currentPattern.category;
    }
  },
  { immediate: true, deep: true }
);

const emitPatternNow = () => {
  if (!activePatternUrl.value) return;
  emit('setPattern', {
    partId: selectedPartId.value,
    options: {
      patternId: activePatternId.value,
      name: activePatternName.value || 'Custom Pattern',
      category: activePatternCategory.value || 'Artwork',
      source: activePatternSource.value || 'preset',
      url: activePatternUrl.value,
      scale: patternScale.value,
      angle: patternAngle.value,
      opacity: patternOpacity.value,
      offsetX: patternOffsetX.value,
      offsetY: patternOffsetY.value,
      patternColor: patternColor.value,
      bgColor: activeBgColor.value
    }
  });
};

const emitCurrentPattern = throttle(() => {
  emitPatternNow();
}, 80, { leading: true, trailing: true });

const emitCurrentPatternImmediate = () => {
  emitCurrentPattern.cancel?.();
  emitPatternNow();
};

const selectPattern = (pattern) => {
  activePatternId.value = getPatternKey(pattern);
  activePatternUrl.value = pattern.url;
  activePatternName.value = pattern.name || 'Pattern';
  activePatternCategory.value = pattern.category || 'Artwork';
  activePatternSource.value = pattern.source || 'preset';
  emitCurrentPatternImmediate();
};

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    activePatternId.value = `custom_${Date.now()}`;
    activePatternUrl.value = event.target?.result;
    activePatternName.value = file.name?.replace(/\.[^/.]+$/, '') || 'Custom Pattern';
    activePatternCategory.value = 'Artwork';
    activePatternSource.value = 'custom_upload';
    emitCurrentPatternImmediate();
  };
  reader.readAsDataURL(file);
};

const clearPatternColor = () => {
  patternColor.value = null;
  emitCurrentPatternImmediate();
};

const setPatternColor = (color) => {
  patternColor.value = color;
  customPatternColor.value = color;
  emitCurrentPatternImmediate();
};

const onCustomPatternColor = () => {
  patternColor.value = customPatternColor.value;
  emitCurrentPatternImmediate();
};

const setBgColor = (color) => {
  activeBgColor.value = color;
  customBgColor.value = color;
  emitCurrentPatternImmediate();
};

const onCustomBgColor = () => {
  activeBgColor.value = customBgColor.value;
  emitCurrentPatternImmediate();
};

const resetControls = () => {
  patternScale.value = 1.0;
  patternAngle.value = 0;
  patternOpacity.value = 1.0;
  patternOffsetX.value = 0;
  patternOffsetY.value = 0;
  patternColor.value = null;
  emitCurrentPatternImmediate();
};

const removeCurrentPattern = () => {
  emitCurrentPattern.cancel?.();
  clearActivePatternState();
  emit('removePattern', {
    partId: selectedPartId.value,
    resetColor: activeBgColor.value
  });
};

onBeforeUnmount(() => {
  emitCurrentPattern.cancel?.();
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

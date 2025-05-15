<script setup lang="ts">
import {darkTheme, GlobalThemeOverrides, NConfigProvider} from 'naive-ui'


const myThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#34c4b3',
    primaryColorHover: '#34c4b3',
    primaryColorPressed: '#34c4b3',
    primaryColorSuppl: '#34c4b3',
  },
  Button: {
    borderRadiusMedium: '200px',
    borderRadiusSmall: '20px'
  },
  Tooltip: {
    borderRadius: '12px',
  },
  Input: {
    borderRadius: '200px',
    paddingMedium: '0 16px 0 12px',
  },
  InputNumber: {
    borderRadius: '200px',
    peers: {
      Input: {
        paddingMedium: '0 16px 0 16px',
      },
    }
  },
  Modal: {
    peers: {
      Card: {
        borderRadius: '20px',
      }
    }
  },
  Menu: {
    borderRadius: '20px',
  },
  Select: {
    peers: {
      InternalSelection: {
        paddingSingle: '0 0 0 16px',
        borderRadius: '200px',
      },
      InternalSelectMenu: {
        borderRadius: '12px',
        paddingMedium: '4px 0 0 24px',
        peers: {
          Scrollbar: {

          },
        }
      },
    }
  }
}
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="myThemeOverrides" inline-theme-disabled>
    <NLoadingBarProvider>
      <NModalProvider>
        <NDialogProvider>
          <NMessageProvider>
            <slot/>
          </NMessageProvider>
        </NDialogProvider>
      </NModalProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped>

</style>
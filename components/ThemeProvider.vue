<script setup lang="ts">
import {darkTheme, GlobalThemeOverrides, NConfigProvider} from 'naive-ui'

const myThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#FACC15',
    primaryColorHover: '#F59E0B',
    primaryColorPressed: '#CA8A04',
    primaryColorSuppl: '#EAB308'
  },
  Button: {
    borderRadiusMedium: '200px',
    borderRadiusSmall: '20px'
  },
  Tooltip: {
    borderRadius: '12px',
    color: '#121212',
    textColor: '#ffffff'
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
  Pagination: {
    itemSize: 32,
    itemBorderRadius: '200px',
    jumperButtonBorderRadius: '200px',
    jumperInputBorderRadius: '200px',
  },
  Modal: {
    color: '#121212',
    textColor: '#ffffff',
    peers: {
      Card: {
        borderRadius: '20px',
        color: '#121212',
        textColor: '#ffffff',
        titleTextColor: '#ffffff',
        closeIconColor: '#ffffff',
        closeColorHover: '#333333',
        closeColorPressed: '#444444'
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
        color: '#121212'
      },
      InternalSelectMenu: {
        borderRadius: '12px',
        paddingMedium: '4px 0 0 24px',
        color: '#121212',
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
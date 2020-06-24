import { Vue } from 'vue-property-decorator'
import appconst from './appconst'
import service from '@/utils/request'

export default class AbpBase extends Vue {
  public ajax = service
  protected loading = false;
  L(value: string, source?: string, ...argus: string[]): string {
    if (source) {
      return window.abp.localization.localize(value, source)
    } else {
      return window.abp.localization.localize(value, appconst.localization.defaultLocalizationSourceName)
    }
  }
  hasPermission(permissionName: string) {
    return window.abp.auth.isGranted(permissionName)
  }
  hasAnyOfPermissions(...argus: string[]) {
    return window.abp.auth.isAnyGranted(...argus)
  }
  hasAllOfPermissions(...argus: string[]) {
    return window.abp.auth.areAllGranted(...argus)
  }
}

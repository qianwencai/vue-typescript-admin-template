import { VuexModule, Module, Action, Mutation, getModule } from 'vuex-module-decorators'
import { login, logout, getUserInfo } from '@/api/users'
import { getToken, setToken, removeToken } from '@/utils/cookies'
import router, { resetRouter } from '@/router'
import { PermissionModule } from './permission'
import { TagsViewModule } from './tags-view'
import store from '@/store'
import Util from '@/lib/util';
import ajax from '@/utils/request'
import appconst from '@/lib/appconst';
export interface IUserState {
  token: string
  name: string
  avatar: string
  introduction: string
  roles: string[]
  email: string
}

@Module({ dynamic: true, store, name: 'user' })
class User extends VuexModule implements IUserState {
  public token = getToken() || ''
  public name = ''
  public avatar = ''
  public introduction = ''
  public roles: string[] = []
  public email = ''

  @Mutation
  private SET_TOKEN(token: string) {
    this.token = token
  }

  @Mutation
  private SET_NAME(name: string) {
    this.name = name
  }

  @Mutation
  private SET_AVATAR(avatar: string) {
    this.avatar = avatar
  }

  @Mutation
  private SET_INTRODUCTION(introduction: string) {
    this.introduction = introduction
  }

  @Mutation
  private SET_ROLES(roles: string[]) {
    this.roles = roles
  }

  @Mutation
  private SET_EMAIL(email: string) {
    this.email = email
  }

  @Action
  public async Login(loginInfo: { userNameOrEmailAddress: string, password: string, rememberClient: boolean }) {
    const rep = await login(loginInfo);
    var tokenExpireDate = loginInfo.rememberClient ? (new Date(new Date().getTime() + 1000 * rep.data.result.expireInSeconds)) : undefined;
    this.SET_TOKEN(rep.data.result.accessToken)
    Util.abp.auth.setToken(rep.data.result.accessToken, tokenExpireDate);
    Util.abp.utils.setCookieValue(
      appconst.authorization.encrptedAuthTokenName,
      rep.data.result.encryptedAccessToken,
      tokenExpireDate,
      Util.abp.appPath
    );
    const data= await ajax.get('/AbpUserConfiguration/GetAll') 
    Util.abp = Util.extend(true, Util.abp, data.data.result)
  }

  @Action
  public ResetToken() {
    Util.abp.auth.clearToken()
    removeToken()
    this.SET_TOKEN('')
    this.SET_ROLES([])
  }

  @Action
  public async GetUserInfo() {
    if (this.token === '') {
      throw Error('GetUserInfo: token is undefined!')
    }
    if (window.abp && window.abp.session && window.abp.session.userId) {
      const { data } = await getUserInfo(window.abp.session.userId.toString())
      if (!data) {
        throw Error('Verification failed, please Login again.')
      }
      const { roleNames, userName, fullName, emailAddress } = data.result

      let roles = [];
      (roleNames as string[]).forEach(item => {
        roles.push(item.toLowerCase())
      })
      // roles must be a non-empty array
      if (!roles || roles.length <= 0) {
        throw Error('GetUserInfo: roles must be a non-null array!')
      }
      let avatar = 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
      this.SET_ROLES(roles)
      this.SET_NAME(userName)
      this.SET_AVATAR(avatar)
      this.SET_INTRODUCTION(fullName)
      this.SET_EMAIL(emailAddress)
    } else {
      throw Error('Verification failed, please Login again.')
    }
  }

  @Action
  public async ChangeRoles(role: string) {
    // Dynamically modify permissions
    const token = role + '-token'
    this.SET_TOKEN(token)
    setToken(token)
    await this.GetUserInfo()
    resetRouter()
    // Generate dynamic accessible routes based on roles
    PermissionModule.GenerateRoutes(this.roles)
    // Add generated routes
    router.addRoutes(PermissionModule.dynamicRoutes)
    // Reset visited views and cached views
    TagsViewModule.delAllViews()
  }

  @Action
  public async LogOut() {
    if (this.token === '') {
      throw Error('LogOut: token is undefined!')
    }

    // await logout()
    removeToken()
    resetRouter()
    this.SET_TOKEN('')
    this.SET_ROLES([])
    Util.abp.auth.clearToken();
    const data = await ajax.get('/AbpUserConfiguration/GetAll')
    Util.abp = Util.extend(true, Util.abp, data.data.result)

  }
}

export const UserModule = getModule(User)

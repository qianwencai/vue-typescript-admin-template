<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="queryParams.keyword"
        placeholder="关键字"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />

      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >{{ $t('table.search') }}</el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >{{ $t('table.add') }}</el-button>
      <!-- <el-button
        v-waves
        :loading="downloadLoading"
        class="filter-item"
        type="primary"
        icon="el-icon-download"
        @click="handleDownload"
      >{{ $t('table.export') }}</el-button>-->
      <!-- <el-checkbox
        v-model="showReviewer"
        class="filter-item"
        style="margin-left:15px;"
        @change="tableKey=tableKey+1"
      >{{ $t('table.reviewer') }}</el-checkbox>-->
    </div>
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="pagedData.items"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column
        label="Id"
        prop="id"
        sortable="custom"
        align="center"
        width="80px"
        :class-name="getSortClass('id')"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="UserName" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.userName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Name" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.fullName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="IsActive" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.isActive?"Yes":"No" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="CreationTime" align="left">
        <template slot-scope="scope">
          <span>{{ new Date(scope.row.creationTime).toLocaleDateString() }}</span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('table.actions')"
        align="center"
        width="230"
        class-name="fixed-width"
      >
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">编辑</el-button>
          <el-button
            v-if="row.status!=='deleted'"
            size="mini"
            type="danger"
            @click="handleModifyStatus(row,'deleted')"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="pagedData.totalCount>0"
      :total="pagedData.totalCount"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.maxResultCount"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" width="700px" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="editModel"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-tabs type="card">
          <el-tab-pane label="用户信息">
            <el-form-item label="登录名" prop="UserName">
              <el-input v-model="editModel.userName" />
            </el-form-item>
            <el-form-item v-if="dialogStatus=='create'" label="登录密码" prop="password">
              <el-input v-model="editModel.password" />
            </el-form-item>
            <el-form-item style="margin-left:0;">
              <el-col :span="11">
                <el-form-item label="姓" prop="surname">
                  <el-input v-model="editModel.surname" />
                </el-form-item>
              </el-col>
              <el-col :span="11">
                <el-form-item label="名" prop="Name">
                  <el-input v-model="editModel.name" />
                </el-form-item>
              </el-col>
            </el-form-item>
            <el-form-item label="邮箱" prop="EmailAddress">
              <el-input type="email" v-model="editModel.emailAddress" />
            </el-form-item>
            <el-form-item label="启用" prop="isActive">
              <el-checkbox v-model="editModel.isActive" label="已启用"></el-checkbox>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="权限配置">
            <el-form-item label="用户组">
              <el-checkbox-group v-model="editModel.roleNames">
                <el-checkbox :label="item.displayName" v-for="item in roleList" :key="item.normalizedName" ></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="dialogStatus==='create'?createData():updateData()"
        >{{ $t('table.confirm') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Inject, Prop, Watch } from "vue-property-decorator";
import PageRequest from "@/store/entities/page-request";
import Pagination from "@/components/Pagination/index.vue";
import { Form } from "element-ui";
import ajax from "@/utils/request";
import {
  UserServiceProxy,
  CreateUserDto,
  UserDto,
  ListResultDtoOfRoleDto,
  ChangePasswordDto,
  ResetPasswordDto,
  PagedResultDtoOfUserDto
} from "@/api/abp-service-proxies";

class PageUserRequest extends PageRequest {
  keyword: string = "";
  isActive: boolean = null; // nullable
  pageIndex: number = 1;
  maxResultCount = 20;
  skipCount = 0;
}

@Component({
  name: "Usermange",
  components: {
    Pagination
  }
})
export default class extends Vue {
  private editModel = {};
  private abpService = new UserServiceProxy(ajax);
  private pagedData = new PagedResultDtoOfUserDto();
  private tableKey = 0;
  private listLoading = true;

  private dialogFormVisible = false;
  private queryParams = new PageUserRequest();

  private dialogStatus = "";
  private textMap = {
    update: "修改用户信息",
    create: "添加用户"
  };
  private pageviewsData = [];
  private rules = {
    type: [{ required: true, message: "type is required", trigger: "change" }],
    timestamp: [
      { required: true, message: "timestamp is required", trigger: "change" }
    ],
    title: [{ required: true, message: "title is required", trigger: "blur" }]
  };
  private downloadLoading = false;

  created() {
    this.getList();
    this.getRoles();
  }
  //   name!: string;
  //   displayName!: string;
  //   normalizedName!: string | null;
  //   description!: string | null;
  //   grantedPermissions!: string[] | null;
  //   id!: number | null;
  roleList = new ListResultDtoOfRoleDto();
  private async getRoles() {
    this.roleList = await this.abpService.getRoles();
  }

  private async getList() {
    this.listLoading = true;
    let qp = this.queryParams;
    this.pagedData = await this.abpService.getAll(
      qp.keyword,
      qp.isActive,
      qp.skipCount,
      qp.maxResultCount
    );
    this.listLoading = false;
  }

  private handleFilter() {
    this.getList();
  }

  private async handleModifyStatus(row: any, status: string) {
    await this.abpService.delete(row.id);
    this.getList();
    this.$message({
      message: "操作成功",
      type: "success"
    });
    row.status = status;
  }

  private sortChange(data: any) {
    const { prop, order } = data;
    if (prop === "id") {
      if (order === "ascending") {
        this.queryParams.sorting = "id";
      } else {
        this.queryParams.sorting = "id desc";
      }
      this.handleFilter();
    }
  }

  private getSortClass(key: string) {
    const sort = this.queryParams.sorting;
    return sort === `${key}`
      ? "ascending"
      : sort === `${key} desc`
      ? "descending"
      : "";
  }
  //初始化创建
  private handleCreate() {
    this.dialogStatus = "create";
    this.dialogFormVisible = true;
    this.editModel = new CreateUserDto();
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }
  //调用接口创建
  private createData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        const createModel = Object.assign(new CreateUserDto(), this.editModel);
        const data = await this.abpService.create(createModel);
        this.pagedData.items.unshift(data);
        this.dialogFormVisible = false;

        this.$notify({
          title: "成功",
          message: "添加成功",
          type: "success",
          duration: 2000
        });
      }
    });
  }
  //初始化修改
  private handleUpdate(row: any) {
    this.editModel = Object.assign({}, row);
    this.dialogStatus = "update";
    this.dialogFormVisible = true;
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }
  //调用接口更新数据
  private updateData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        const editInput = Object.assign(new UserDto(), this.editModel);
        const data = await this.abpService.update(editInput);
        for (const v of this.pagedData.items) {
          if (v.id === data.id) {
            const index = this.pagedData.items.indexOf(v);
            this.pagedData.items.splice(index, 1, data);
            break;
          }
        }
        this.dialogFormVisible = false;
        this.$notify({
          title: "成功",
          message: "更新成功",
          type: "success",
          duration: 2000
        });
      }
    });
  }
}
</script>

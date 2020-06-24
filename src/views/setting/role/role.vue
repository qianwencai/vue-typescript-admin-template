<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="queryParams.customerName"
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

      <el-table-column label="角色名" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="显示名" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.displayName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      
<!-- 操作按钮 -->
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
      <el-tabs type="card">
        <el-tab-pane label="用户信息">
          <el-form
            ref="dataForm"
            :rules="rules"
            :model="createModel"
            label-position="left"
            label-width="100px"
            style="width: 400px; margin-left:50px;"
          >
            <el-form-item label="登录名" prop="UserName">
              <el-input v-model="createModel.UserName" />
            </el-form-item>
            <el-form-item label="名字" prop="Name">
              <el-input v-model="createModel.Name" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="权限配置">权限配置</el-tab-pane>
      </el-tabs>
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
  RoleServiceProxy,
  CreateRoleDto,
  RoleDto,
  ListResultDtoOfRoleListDto,
  ListResultDtoOfPermissionDto,
  GetRoleForEditOutput,
  PagedResultDtoOfRoleDto 
} from "@/api/abp-service-proxies";
//getAll方法所需要的参数
class PageUserRequest extends PageRequest {
  keyword: string = ""; 
  pageIndex: number = 1;
  maxResultCount = 20;
  skipCount = 0;
}

@Component({
  name: "Customers",
  components: {
    Pagination
  }
})
export default class extends Vue {
  private createModel = new RoleDto();
  private editModel = new RoleDto();
  private abpService = new RoleServiceProxy(ajax);
  private pagedData = new PagedResultDtoOfRoleDto();
  private tableKey = 0;
  private listLoading = true;

  private dialogFormVisible = false;
  private queryParams = new PageUserRequest();

  private dialogStatus = "";
  private textMap = {
    update: "Edit",
    create: "Create"
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
  }

  private async getList() {
    this.listLoading = true;

    this.queryParams.skipCount = (this.queryParams.pageIndex -1 ) *  this.queryParams.maxResultCount;
    let qp = this.queryParams;     
    this.pagedData = await this.abpService.getAll(
      qp.keyword, 
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

  private handleCreate() {
    this.createModel = new RoleDto();
    this.dialogStatus = "create";
    this.dialogFormVisible = true;
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }

  private createData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        const data = await this.abpService.create(this.createModel);
        this.pagedData.items.unshift(data);
        this.dialogFormVisible = false;

        this.$notify({
          title: "成功",
          message: "创建成功",
          type: "success",
          duration: 2000
        });
      }
    });
  }

  private handleUpdate(row: any) {
    this.editModel = Object.assign({}, row);
    this.dialogStatus = "update";
    this.dialogFormVisible = true;
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }

  private updateData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        const data = await this.abpService.update(this.editModel);
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

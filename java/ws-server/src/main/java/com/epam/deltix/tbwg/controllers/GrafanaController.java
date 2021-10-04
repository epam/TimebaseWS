package com.epam.deltix.tbwg.controllers;

import com.epam.deltix.tbwg.model.grafana.DynamicList;
import com.epam.deltix.tbwg.model.grafana.GrafanaVersion;
import com.epam.deltix.tbwg.model.grafana.StreamSchema;
import com.epam.deltix.tbwg.model.grafana.TimeSeriesEntry;
import com.epam.deltix.tbwg.model.grafana.queries.DataQueryRequest;
import com.epam.deltix.tbwg.model.grafana.queries.SelectQuery;
import com.epam.deltix.tbwg.services.grafana.base.GrafanaService;
import com.epam.deltix.tbwg.services.grafana.exc.NoSuchStreamException;
import com.epam.deltix.tbwg.services.grafana.exc.ValidationException;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.grafana.model.DataFrame;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@ConditionalOnProperty(name = "grafana.enabled", havingValue = "true", matchIfMissing = true)
@RestController
@RequestMapping("/grafana/v0")
@CrossOrigin
public class GrafanaController {

    private final GrafanaService grafanaService;

    @Autowired
    public GrafanaController(GrafanaService grafanaService) {
        this.grafanaService = grafanaService;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public GrafanaVersion grafanaVersion() {
        return new GrafanaVersion();
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/streams", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DynamicList> streams(@RequestParam(required = false, defaultValue = "") String template,
                                               @RequestParam(required = false, defaultValue = "0") int offset,
                                               @RequestParam(required = false, defaultValue = "30") int limit) {
        return ResponseEntity.ok(grafanaService.listStreams(template, offset, limit));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/symbols", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DynamicList> symbols(@RequestParam String stream,
                                               @RequestParam(required = false, defaultValue = "") String template,
                                               @RequestParam(required = false, defaultValue = "0") int offset,
                                               @RequestParam(required = false, defaultValue = "30") int limit)
            throws NoSuchStreamException {
        return ResponseEntity.ok(grafanaService.listSymbols(stream, template, offset, limit));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/schema", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamSchema> schema(@RequestParam String stream) throws NoSuchStreamException {
        return ResponseEntity.ok(grafanaService.schema(stream));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/groupByViewOptions", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public List<String> groupByOptions() {
        return grafanaService.groupByViewOptions();
    }

    @RequestMapping(value = "/queries/selectTS", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public List<TimeSeriesEntry> selectTS(@Valid @RequestBody DataQueryRequest<SelectQuery> request) throws ValidationException, RecordValidationException {
        return grafanaService.timeSeries(request);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/queries/selectDF", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public List<DataFrame> selectDataFrame(@Valid @RequestBody DataQueryRequest<SelectQuery> request) throws ValidationException, RecordValidationException {
        return grafanaService.dataFrames(request);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/queries/select", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Object> select(@Valid @RequestBody DataQueryRequest<SelectQuery> request) throws ValidationException, RecordValidationException {
        return grafanaService.select(request);
    }


}
